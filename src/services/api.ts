// src/services/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { isTokenExpired } from '../utils/jwtDecoder';
import { store } from '../store';
import { logout, setCredentials } from '../store/slices/authSlice';

const DEV1_IP = 'http://192.168.0.115:8081/api'; // Your backend IP
const DEV2_IP = 'http://192.168.0.115:8081/api';

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
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor – attach token from Redux/LocalStorage
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

  // Response interceptor – handle Token Refresh on 401 / 403
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response) {
        const { status, data } = error.response;

        // Check if error is due to expired token (401 or 403) and request hasn't been retried yet
        if ((status === 401 || status === 403) && !originalRequest._retry) {
          
          if (isRefreshing) {
            // If another request is already refreshing, queue this request
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return instance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
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
            // Call refresh endpoint using standard axios to avoid infinite loops
            const response = await axios.post(`${baseURL}/auth/refresh`, {
              refreshToken,
            });

            const newAuthData = response.data;
            const newAccessToken = newAuthData.accessToken;
            const newRefreshToken = newAuthData.refreshToken || refreshToken;

            // Update Redux state and LocalStorage with new tokens
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

            // Update default headers and retry original request
            instance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            isRefreshing = false;
            processQueue(null, newAccessToken);

            return instance(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            processQueue(refreshError, null);

            // If refresh token is also expired/invalid, force logout
            store.dispatch(logout());
            localStorage.clear();
            window.location.href = '/login';

            return Promise.reject(refreshError);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const apiDev1 = createApiClient(DEV1_IP);
export const apiDev2 = createApiClient(DEV2_IP);
export default apiDev1;