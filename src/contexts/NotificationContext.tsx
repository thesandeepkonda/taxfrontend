import React, { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchNotifications,
  markNotificationAsRead,
  addRealtimeNotification,
  clearNotifications,
  NotificationItem,
} from '../store/slices/notificationSlice';
import { useToast } from './ToastContext';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import api from '../services/api';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  getNotifications: (page?: number, size?: number) => void;
  markAsRead: (notificationId: number) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const { items: notifications, unreadCount, loading, error } = useSelector(
    (state: RootState) => state.notifications
  );
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // 1. Fetch Paginated Notifications (Pass page & size)
  const getNotifications = useCallback(
    (page = 0, size = 15) => {
      dispatch(fetchNotifications({ page, size }));
    },
    [dispatch]
  );

  // 2. Mark Single Notification as Read
  const markAsRead = useCallback(
    (notificationId: number) => {
      dispatch(markNotificationAsRead(notificationId));
    },
    [dispatch]
  );

  // 3. Clear Local Notifications
  const clearAll = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

  // 4. Real-time SSE Connection & Auto Toast Popup
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const controller = new AbortController();
    
    // Dynamically retrieve base URL from api instance configuration
    const baseURL = api.defaults.baseURL || 'http://192.168.0.185:8080/api';
    const sseUrl = `${baseURL}/notifications/subscribe`;

    fetchEventSource(sseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal: controller.signal,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log('⚡ Notification SSE Connected!');
        }
      },
      onmessage(event) {
        if (event.event === 'notification') {
          try {
            const newNotification: NotificationItem = JSON.parse(event.data);
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
      controller.abort();
    };
  }, [isAuthenticated, token, dispatch, showToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        getNotifications,
        markAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};