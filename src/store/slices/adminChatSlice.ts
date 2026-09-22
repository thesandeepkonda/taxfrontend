// src/store/slices/adminChatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// ============================================================
// TYPES
// ============================================================
export interface AdminChatEmployee {
  id: number;
  name: string;
  departmentName: string;
  roleName: string;
  isOnline: boolean;
}

export interface AdminChatConversation {
  id: number;
  name: string;
  type: 'INDIVIDUAL' | 'GROUP';
  updatedAt: string;
  unreadCount: number;
  isOnline: boolean | null;
}

export interface AdminChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number | null;
  groupId: number | null;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  type: string;
  timestamp: string;
  isRead: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  reactions?: Record<string, string>;
  isPinned?: boolean;
  replyToId?: number | null;
  replyToMessage?: {
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    type: string;
  } | null;
}

export interface AdminSelectedPartner {
  id: number;
  name: string;
  type: 'INDIVIDUAL' | 'GROUP';
}

interface AdminChatState {
  // STEP 1 — All employees
  employees: AdminChatEmployee[];
  isLoadingEmployees: boolean;

  // STEP 2 — Selected employee + their conversations
  selectedEmployee: AdminChatEmployee | null;
  conversations: AdminChatConversation[];
  isLoadingConversations: boolean;

  // STEP 3 — Selected partner + messages
  selectedPartner: AdminSelectedPartner | null;
  messages: AdminChatMessage[];
  isLoadingMessages: boolean;
  messagesPage: number;
  hasMoreMessages: boolean;
  totalMessages: number;

  error: string | null;
}

const initialState: AdminChatState = {
  employees: [],
  isLoadingEmployees: false,

  selectedEmployee: null,
  conversations: [],
  isLoadingConversations: false,

  selectedPartner: null,
  messages: [],
  isLoadingMessages: false,
  messagesPage: 0,
  hasMoreMessages: true,
  totalMessages: 0,

  error: null,
};

// ============================================================
// STEP 1 THUNK — Load all employees
// GET /api/admin/chats/employees
// ============================================================
export const fetchAdminChatEmployees = createAsyncThunk(
  'adminChat/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/chats/employees');
      return response.data as AdminChatEmployee[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load employees'
      );
    }
  }
);

// ============================================================
// STEP 2 THUNK — Load conversations of one employee
// GET /api/admin/chats/employees/{employeeId}/sidebar
// ============================================================
export const fetchAdminEmployeeConversations = createAsyncThunk(
  'adminChat/fetchConversations',
  async (employeeId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/admin/chats/employees/${employeeId}/sidebar`
      );
      return response.data as AdminChatConversation[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load conversations'
      );
    }
  }
);

// ============================================================
// STEP 3a THUNK — Load direct messages between employee & partner
// GET /api/admin/chats/employees/{employeeId}/direct/{partnerId}
// ============================================================
export const fetchAdminDirectMessages = createAsyncThunk(
  'adminChat/fetchDirectMessages',
  async (
    params: {
      employeeId: number;
      partnerId: number;
      page?: number;
      size?: number;
    },
    { rejectWithValue }
  ) => {
    const { employeeId, partnerId, page = 0, size = 50 } = params;
    try {
      const response = await api.get(
        `/admin/chats/employees/${employeeId}/direct/${partnerId}`,
        { params: { page, size } }
      );
      return {
        content: (response.data.content || []) as AdminChatMessage[],
        totalElements: response.data.totalElements || 0,
        page: response.data.number || 0,
        totalPages: response.data.totalPages || 0,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load messages'
      );
    }
  }
);

// ============================================================
// STEP 3b THUNK — Load group chat history
// GET /api/admin/chats/groups/{groupId}
// ============================================================
export const fetchAdminGroupMessages = createAsyncThunk(
  'adminChat/fetchGroupMessages',
  async (
    params: { groupId: number; page?: number; size?: number },
    { rejectWithValue }
  ) => {
    const { groupId, page = 0, size = 50 } = params;
    try {
      const response = await api.get(`/admin/chats/groups/${groupId}`, {
        params: { page, size },
      });
      return {
        content: (response.data.content || []) as AdminChatMessage[],
        totalElements: response.data.totalElements || 0,
        page: response.data.number || 0,
        totalPages: response.data.totalPages || 0,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load group messages'
      );
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const adminChatSlice = createSlice({
  name: 'adminChat',
  initialState,
  reducers: {
    setSelectedEmployee: (
      state,
      action: PayloadAction<AdminChatEmployee | null>
    ) => {
      state.selectedEmployee = action.payload;
      state.conversations = [];
      state.selectedPartner = null;
      state.messages = [];
      state.messagesPage = 0;
      state.hasMoreMessages = true;
      state.totalMessages = 0;
    },
    setSelectedPartner: (
      state,
      action: PayloadAction<AdminSelectedPartner | null>
    ) => {
      state.selectedPartner = action.payload;
      state.messages = [];
      state.messagesPage = 0;
      state.hasMoreMessages = true;
      state.totalMessages = 0;
    },
    clearAdminChatError: (state) => {
      state.error = null;
    },
    clearAdminChat: (state) => {
      state.selectedEmployee = null;
      state.conversations = [];
      state.selectedPartner = null;
      state.messages = [];
      state.messagesPage = 0;
      state.hasMoreMessages = true;
      state.totalMessages = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- STEP 1 ----------
      .addCase(fetchAdminChatEmployees.pending, (state) => {
        state.isLoadingEmployees = true;
        state.error = null;
      })
      .addCase(fetchAdminChatEmployees.fulfilled, (state, action) => {
        state.isLoadingEmployees = false;
        state.employees = action.payload;
      })
      .addCase(fetchAdminChatEmployees.rejected, (state, action) => {
        state.isLoadingEmployees = false;
        state.error = action.payload as string;
      })

      // ---------- STEP 2 ----------
      .addCase(fetchAdminEmployeeConversations.pending, (state) => {
        state.isLoadingConversations = true;
        state.error = null;
      })
      .addCase(fetchAdminEmployeeConversations.fulfilled, (state, action) => {
        state.isLoadingConversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchAdminEmployeeConversations.rejected, (state, action) => {
        state.isLoadingConversations = false;
        state.error = action.payload as string;
      })

      // ---------- STEP 3a — Direct messages ----------
      .addCase(fetchAdminDirectMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchAdminDirectMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        const sorted = [...action.payload.content].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        if (action.payload.page === 0) {
          state.messages = sorted;
        } else {
          state.messages = [...sorted, ...state.messages];
        }
        state.messagesPage = action.payload.page;
        state.totalMessages = action.payload.totalElements;
        state.hasMoreMessages =
          action.payload.page < action.payload.totalPages - 1;
      })
      .addCase(fetchAdminDirectMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })

      // ---------- STEP 3b — Group messages ----------
      .addCase(fetchAdminGroupMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchAdminGroupMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        const sorted = [...action.payload.content].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        if (action.payload.page === 0) {
          state.messages = sorted;
        } else {
          state.messages = [...sorted, ...state.messages];
        }
        state.messagesPage = action.payload.page;
        state.totalMessages = action.payload.totalElements;
        state.hasMoreMessages =
          action.payload.page < action.payload.totalPages - 1;
      })
      .addCase(fetchAdminGroupMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedEmployee,
  setSelectedPartner,
  clearAdminChat,
  clearAdminChatError,
} = adminChatSlice.actions;

export default adminChatSlice.reducer;