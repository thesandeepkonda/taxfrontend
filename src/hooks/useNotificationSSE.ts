import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { addRealtimeNotification, fetchNotifications } from '../store/slices/notificationSlice';
import { useToast } from '../contexts/ToastContext';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import api from '../services/api';

export const useNotificationSSE = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      return;
    }

    // 1. Initial Load from Database
    dispatch(fetchNotifications({ page: 0, size: 20 }));

    // 2. AbortController for cleanup
    const controller = new AbortController();
    controllerRef.current = controller;

    // 3. Connect using base URL from api instance
    const baseURL = api.defaults.baseURL || 'http://192.168.0.185:8080/api';
    const sseUrl = `${baseURL}/notifications/subscribe`;

    fetchEventSource(sseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      signal: controller.signal,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log('⚡ SSE Connected with Bearer Header!');
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          console.error('SSE Client error:', response.status, response.statusText);
        }
      },
      onmessage(event) {
        if (event.event === 'notification') {
          try {
            const newNotification = JSON.parse(event.data);
            dispatch(addRealtimeNotification(newNotification));
            showToast(`🔔 ${newNotification.title}: ${newNotification.message}`, 'info');
          } catch (err) {
            console.error('Failed to parse SSE notification payload:', err);
          }
        }
      },
      onerror(err) {
        console.warn('⚠️ SSE Connection error:', err);
      },
    });

    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [isAuthenticated, token, dispatch, showToast]);
};