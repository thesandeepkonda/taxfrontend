// src/services/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../store';
import { logout, setCredentials } from '../store/slices/authSlice';
import { retryRequest, defaultShouldRetry } from './retry';
import { globalCircuitBreaker } from './circuitBreaker'; // ✅ Import circuit breaker

const DEV1_IP = 'http://192.168.0.185:8080/api'; // Your backend IP
const DEV2_IP = 'http://192.168.0.96:8080/api';

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const createApiClient = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 5 * 60 * 1000, // ✅ Updated to 5 minutes (300,000 ms)
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request Interceptor – attach token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = store.getState().auth.accessToken || localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor – refresh token, retry, and circuit breaker
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // ✅ Record success – may close circuit if it was half-open
      globalCircuitBreaker.recordSuccess();
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Prevent infinite loop if refresh endpoint itself fails
      if (originalRequest.url?.includes('/auth/refresh')) {
        store.dispatch(logout());
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // 🛑 CIRCUIT BREAKER CHECK
      if (!globalCircuitBreaker.canCall()) {
        // Circuit is OPEN – reject immediately with a special flag
        const circuitError = new Error('Service temporarily unavailable');
        (circuitError as any)._isCircuitOpen = true;
        (circuitError as any)._isFinalFailure = true; // Flag for toast control
        return Promise.reject(circuitError);
      }

      // If we have a response, check status
      if (error.response) {
        const { status } = error.response;

        // ---------- Token Refresh (401 / 403) ----------
        if ((status === 401 || status === 403) && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return instance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          const refreshToken = store.getState().auth.refreshToken || localStorage.getItem('refreshToken');

          if (!refreshToken) {
            isRefreshing = false;
            store.dispatch(logout());
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(error);
          }

          try {
            const response = await axios.post(`${baseURL}/auth/refresh`, {
              refreshToken,
            });

            const newAuthData = response.data;
            const newAccessToken = newAuthData.accessToken;
            const newRefreshToken = newAuthData.refreshToken || refreshToken;

            const currentUser = store.getState().auth.user;
            if (currentUser) {
              store.dispatch(
                setCredentials({
                  user: currentUser,
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                })
              );
            }
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            instance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            isRefreshing = false;
            processQueue(null, newAccessToken);

            return instance(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            processQueue(refreshError, null);

            store.dispatch(logout());
            localStorage.clear();
            window.location.href = '/login';

            return Promise.reject(refreshError);
          }
        }

        // ---------- Retry Logic (5xx, 429, Network Errors) ----------
        const isRetryable = defaultShouldRetry(error);

        if (isRetryable) {
          // Initialize retry count if not present
          if (originalRequest._retryCount === undefined) {
            originalRequest._retryCount = 0;
          }

          // ✅ If we've already retried 3 times, record failure and reject
          if (originalRequest._retryCount >= 3) {
            console.error(`❌ Request ${originalRequest.url} failed after 3 retries.`);
            // Record failure – may open circuit
            globalCircuitBreaker.recordFailure();

            // Add a flag so components can suppress toasts
            error._isFinalFailure = true;
            return Promise.reject(error);
          }

          // Increment retry count
          originalRequest._retryCount++;

          // Add a flag to indicate this is a retry (suppress toast)
          error._isRetry = true;

          // Exponential backoff: 1s, 2s, 4s
          const delay = 1000 * Math.pow(2, originalRequest._retryCount - 1);
          console.warn(
            `🔄 Retrying ${originalRequest.url} (attempt ${originalRequest._retryCount}/3) after ${delay}ms...`
          );

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Retry the request
          return instance(originalRequest);
        }

        // ---------- Non-retryable errors (e.g., 400, 404) ----------
        // We don't record failure for client errors
        error._isFinalFailure = true;
        return Promise.reject(error);
      }

      // ---------- Network error (no response) ----------
      // These are retryable, but we might have already retried 3 times.
      // If we get here after retries, record failure.
      if (originalRequest._retryCount !== undefined && originalRequest._retryCount >= 3) {
        globalCircuitBreaker.recordFailure();
      }

      // Mark as final failure
      error._isFinalFailure = true;
      return Promise.reject(error);
    }
  );

  return instance;
};

export const apiDev1 = createApiClient(DEV1_IP);
export const apiDev2 = createApiClient(DEV2_IP);
export default apiDev1;