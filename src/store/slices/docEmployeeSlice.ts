// src/store/slices/docEmployeeSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface DocClientResponse {
  assignmentId: number;
  clientId: number;
  name: string;
  maskedPhone: string;
  maskedEmail: string;
  status: string;
  currentStage: string;
  remarks?: string;
  nextFollowUpAt: string | null;
  callInProgress: boolean;
  lastCalledAt: string | null;
}

export interface DocCallResponse {
  callId: number;
  clientId: number;
  clientName: string;
  answered: boolean;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
}

export interface UpdateDocClientDto {
  status?: string;
  remarks?: string;
  nextFollowUpAt?: string;
}

export interface StartCallRequest {
  providerCallId?: string;
}

export interface EndCallRequest {
  providerCallId?: string;
  answered?: boolean;
  recordingUrl?: string;
}

// NEW: Comment types
export interface CommentResponse {
  id: number;
  clientId: number;
  employeeId: number;
  employeeName: string;
  comment: string;
  commentType: string;
  createdAt: string;
}

interface DocEmployeeState {
  clients: DocClientResponse[];
  currentClient: DocClientResponse | null;
  followUps: DocClientResponse[];
  notLifted: DocClientResponse[];
  calls: DocCallResponse[];
  comments: CommentResponse[];          // ✅ NEW
  loading: boolean;
  error: string | null;
}

const initialState: DocEmployeeState = {
  clients: [],
  currentClient: null,
  followUps: [],
  notLifted: [],
  calls: [],
  comments: [],
  loading: false,
  error: null,
};

// Get my clients
export const fetchDocClients = createAsyncThunk(
  'docEmployee/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/doc/clients');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doc clients');
    }
  }
);

// Get a specific client by assignmentId
export const fetchDocClientById = createAsyncThunk(
  'docEmployee/fetchClientById',
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/doc/clients/${assignmentId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client');
    }
  }
);

// Update client (status, remarks, follow-up) - OLD endpoint
export const updateDocClient = createAsyncThunk(
  'docEmployee/updateClient',
  async ({ assignmentId, data }: { assignmentId: number; data: UpdateDocClientDto }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/doc/clients/${assignmentId}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Update failed');
    }
  }
);

// Get follow-ups
export const fetchDocFollowUps = createAsyncThunk(
  'docEmployee/fetchFollowUps',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/doc/follow-ups');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch follow-ups');
    }
  }
);

// Get not-lifted
export const fetchDocNotLifted = createAsyncThunk(
  'docEmployee/fetchNotLifted',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/doc/not-lifted');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch not-lifted');
    }
  }
);

// Get my calls
export const fetchDocCalls = createAsyncThunk(
  'docEmployee/fetchCalls',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/doc/calls');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch calls');
    }
  }
);

// Get client calls
export const fetchDocClientCalls = createAsyncThunk(
  'docEmployee/fetchClientCalls',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/doc/clients/${clientId}/calls`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client calls');
    }
  }
);

// Start call
export const startDocCall = createAsyncThunk(
  'docEmployee/startCall',
  async ({ assignmentId, data }: { assignmentId: number; data?: StartCallRequest }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/doc/clients/${assignmentId}/calls/start`, data || {});
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Start call failed');
    }
  }
);

// End call
export const endDocCall = createAsyncThunk(
  'docEmployee/endCall',
  async ({ callId, data }: { callId: number; data: EndCallRequest }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/doc/calls/${callId}/end`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'End call failed');
    }
  }
);

// ============================================================
// ✅ NEW THUNKS (from backend git pull)
// ============================================================

// ADD comment (Employee)
export const addComment = createAsyncThunk(
  'docEmployee/addComment',
  async ({ clientId, assignmentId, comment, commentType }: 
    { clientId: number; assignmentId?: number; comment: string; commentType?: string }, 
    { rejectWithValue }) => {
    try {
      const payload: any = { clientId, comment, commentType: commentType || 'GENERAL' };
      if (assignmentId) payload.assignmentId = assignmentId;
      const response = await api.post('/doc/comments', payload);
      return response.data; // AdminCommentResponseDto
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

// UPDATE status (Employee) - NEW separate endpoint
export const updateStatus = createAsyncThunk(
  'docEmployee/updateStatus',
  async ({ assignmentId, status }: { assignmentId: number; status: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/doc/clients/${assignmentId}/status`, { status });
      return response.data; // DocClientResponseDto
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

// GET client comments (Employee)
export const fetchClientComments = createAsyncThunk(
  'docEmployee/fetchClientComments',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/doc/clients/${clientId}/comments`);
      return response.data; // List<CommentResponseDto>
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client comments');
    }
  }
);

// EDIT comment (Employee - own comment)
export const editComment = createAsyncThunk(
  'docEmployee/editComment',
  async ({ commentId, comment }: { commentId: number; comment: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/doc/comments/${commentId}`, { comment });
      return response.data; // AdminCommentResponseDto
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to edit comment');
    }
  }
);

// GET clients by status (Employee)
export const fetchClientsByStatus = createAsyncThunk(
  'docEmployee/fetchClientsByStatus',
  async (status: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/doc/clients/status/${status}`);
      return response.data; // List<DocClientResponseDto>
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients by status');
    }
  }
);

const docEmployeeSlice = createSlice({
  name: 'docEmployee',
  initialState,
  reducers: {
    clearDocEmployee(state) {
      state.clients = [];
      state.currentClient = null;
      state.followUps = [];
      state.notLifted = [];
      state.calls = [];
      state.comments = [];
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocClients.fulfilled, (state, action: PayloadAction<DocClientResponse[]>) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchDocClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDocClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocClientById.fulfilled, (state, action: PayloadAction<DocClientResponse>) => {
        state.loading = false;
        state.currentClient = action.payload;
      })
      .addCase(fetchDocClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDocClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDocClient.fulfilled, (state, action: PayloadAction<DocClientResponse>) => {
        state.loading = false;
        state.currentClient = action.payload;
        // update in list
        const idx = state.clients.findIndex(c => c.assignmentId === action.payload.assignmentId);
        if (idx !== -1) state.clients[idx] = action.payload;
      })
      .addCase(updateDocClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDocFollowUps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocFollowUps.fulfilled, (state, action: PayloadAction<DocClientResponse[]>) => {
        state.loading = false;
        state.followUps = action.payload;
      })
      .addCase(fetchDocFollowUps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDocNotLifted.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocNotLifted.fulfilled, (state, action: PayloadAction<DocClientResponse[]>) => {
        state.loading = false;
        state.notLifted = action.payload;
      })
      .addCase(fetchDocNotLifted.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDocCalls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocCalls.fulfilled, (state, action: PayloadAction<DocCallResponse[]>) => {
        state.loading = false;
        state.calls = action.payload;
      })
      .addCase(fetchDocCalls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(startDocCall.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startDocCall.fulfilled, (state, action: PayloadAction<DocCallResponse>) => {
        state.loading = false;
        state.calls.unshift(action.payload);
        // update client callInProgress
        const client = state.clients.find(c => c.clientId === action.payload.clientId);
        if (client) client.callInProgress = true;
        if (state.currentClient?.clientId === action.payload.clientId) {
          state.currentClient.callInProgress = true;
        }
      })
      .addCase(startDocCall.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(endDocCall.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endDocCall.fulfilled, (state, action: PayloadAction<DocCallResponse>) => {
        state.loading = false;
        const idx = state.calls.findIndex(c => c.callId === action.payload.callId);
        if (idx !== -1) state.calls[idx] = action.payload;
        // update client callInProgress
        const client = state.clients.find(c => c.clientId === action.payload.clientId);
        if (client) client.callInProgress = false;
        if (state.currentClient?.clientId === action.payload.clientId) {
          state.currentClient.callInProgress = false;
        }
      })
      .addCase(endDocCall.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================================
      // ✅ NEW: addComment
      // ============================================================
      .addCase(addComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // action.payload is AdminCommentResponseDto
        // Add to comments list
        const newComment: CommentResponse = {
          id: action.payload.id,
          clientId: action.payload.clientId,
          employeeId: action.payload.employeeId,
          employeeName: action.payload.employeeName,
          comment: action.payload.comment,
          commentType: action.payload.commentType,
          createdAt: action.payload.createdAt,
        };
        state.comments.unshift(newComment);
      })
      .addCase(addComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================================
      // ✅ NEW: updateStatus
      // ============================================================
      .addCase(updateStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStatus.fulfilled, (state, action: PayloadAction<DocClientResponse>) => {
        state.loading = false;
        const updated = action.payload;
        // Update in clients list
        const idx = state.clients.findIndex(c => c.assignmentId === updated.assignmentId);
        if (idx !== -1) state.clients[idx] = updated;
        if (state.currentClient?.assignmentId === updated.assignmentId) {
          state.currentClient = updated;
        }
      })
      .addCase(updateStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================================
      // ✅ NEW: fetchClientComments
      // ============================================================
      .addCase(fetchClientComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientComments.fulfilled, (state, action: PayloadAction<CommentResponse[]>) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchClientComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================================
      // ✅ NEW: editComment
      // ============================================================
      .addCase(editComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editComment.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.comments.findIndex(c => c.id === updated.id);
        if (idx !== -1) {
          state.comments[idx] = {
            id: updated.id,
            clientId: updated.clientId,
            employeeId: updated.employeeId,
            employeeName: updated.employeeName,
            comment: updated.comment,
            commentType: updated.commentType,
            createdAt: updated.createdAt,
          };
        }
      })
      .addCase(editComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================================
      // ✅ NEW: fetchClientsByStatus
      // ============================================================
      .addCase(fetchClientsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientsByStatus.fulfilled, (state, action: PayloadAction<DocClientResponse[]>) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClientsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDocEmployee, clearError } = docEmployeeSlice.actions;
export default docEmployeeSlice.reducer;