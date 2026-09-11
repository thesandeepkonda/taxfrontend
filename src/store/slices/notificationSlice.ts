import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  link?: string | null;
}

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
  page: 0,
  totalPages: 1,
  hasMore: true,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 0, size = 15 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications', {
        params: { page, size },
      });
      return { data: response.data, page };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      return notificationId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark as read');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addRealtimeNotification: (state, action: PayloadAction<NotificationItem>) => {
      const exists = state.items.some((item) => item.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
        state.unreadCount += 1;
      }
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.hasMore = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { content, totalPages } = action.payload.data;
        const currentPage = action.payload.page;

        if (currentPage === 0) {
          state.items = content;
        } else {
          const existingIds = new Set(state.items.map((i) => i.id));
          const newUniqueItems = content.filter((item: NotificationItem) => !existingIds.has(item.id));
          state.items = [...state.items, ...newUniqueItems];
        }

        state.page = currentPage;
        state.totalPages = totalPages;
        state.hasMore = currentPage < totalPages - 1;

        state.unreadCount = state.items.filter(
          (item) => !(item.isRead ?? item.read)
        ).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const item = state.items.find((n) => n.id === id);
        if (item) {
          item.isRead = true;
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { addRealtimeNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;