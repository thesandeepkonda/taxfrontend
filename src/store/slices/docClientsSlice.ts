// src/store/slices/docClientsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiDev2 } from '../../services/api';

export interface DocClient {
  assignmentId: number;
  callInProgress: boolean;
  clientId: number;
  currentStage: string;
  lastCalledAt: string | null;
  maskedEmail: string;
  maskedPhone: string;
  name: string;
  nextFollowUpAt: string | null;
  remarks: string | null;
  status: string;
}

export interface CallResponse {
  callId: number;
  clientId: number;
  clientName: string;
  answered: boolean;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
}

export interface DocumentRequestPayload {
  clientId: number;
  expiresAt: string;
  documentTypes: string[];
}

interface DocClientsState {
  list: DocClient[];
  callHistory: CallResponse[];
  activeCall: CallResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: DocClientsState = {
  list: [],
  callHistory: [],
  activeCall: null,
  loading: false,
  error: null,
};

// Async Thunk: Fetch all clients
export const fetchDocClients = createAsyncThunk(
  'docClients/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get('/doc/clients');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch documentation clients');
    }
  }
);

// Async Thunk: Fetch follow-up clients
export const fetchFollowUpClients = createAsyncThunk(
  'docClients/fetchFollowUps',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get('/doc/follow-ups');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch follow-ups');
    }
  }
);

// Async Thunk: Fetch not-lifted clients
export const fetchNotLiftedClients = createAsyncThunk(
  'docClients/fetchNotLifted',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get('/doc/not-lifted');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch not lifted clients');
    }
  }
);

// Async Thunk: Fetch call history
export const fetchCallHistory = createAsyncThunk(
  'docClients/fetchCallHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get('/doc/calls');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch call history');
    }
  }
);

// Async Thunk: Update client status
export const updateClientStatus = createAsyncThunk(
  'docClients/updateStatus',
  async ({ clientId, payload }: { clientId: number; payload: { status: string; remarks?: string | null; nextFollowUpAt?: string | null } }, { rejectWithValue }) => {
    try {
      const response = await apiDev2.put(`/doc/clients/${clientId}`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update client status');
    }
  }
);

// Async Thunk: Start a call
export const startClientCall = createAsyncThunk(
  'docClients/startCall',
  async ({ clientId, providerCallId }: { clientId: number; providerCallId: string }, { rejectWithValue }) => {
    try {
      const response = await apiDev2.post(`/doc/clients/${clientId}/calls/start`, { providerCallId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start call');
    }
  }
);

// Async Thunk: End a call
export const endClientCall = createAsyncThunk(
  'docClients/endCall',
  async ({ callId, payload }: { callId: number; payload: { providerCallId: string, answered: boolean, recordingUrl: string } }, { rejectWithValue }) => {
    try {
      const response = await apiDev2.post(`/doc/calls/${callId}/end`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end call');
    }
  }
);

// Async Thunk: Request Documents from Client
export const requestClientDocuments = createAsyncThunk(
  'docClients/requestDocuments',
  async (payload: DocumentRequestPayload, { rejectWithValue }) => {
    try {
      const response = await apiDev2.post('/documents/request', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request documents');
    }
  }
);

// Async Thunk: Get Public Documents Info
export const fetchPublicDocuments = createAsyncThunk(
  'docClients/fetchPublicDocuments',
  async (shareToken: string, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get(`/documents/public/${shareToken}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch public documents');
    }
  }
);

// Async Thunk: Post Client Comment
export const postClientComment = createAsyncThunk(
  'docClients/postComment',
  async (payload: { clientId: number; assignmentId: number; comment: string; commentType: string }, { rejectWithValue }) => {
    try {
      const response = await apiDev2.post('/doc/comments', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to post comment');
    }
  }
);

const docClientsSlice = createSlice({
  name: 'docClients',
  initialState,
  reducers: {
    clearDocClientsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Clients
      .addCase(fetchDocClients.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDocClients.fulfilled, (state, action: PayloadAction<DocClient[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchDocClients.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      
      // Fetch Follow Ups
      .addCase(fetchFollowUpClients.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFollowUpClients.fulfilled, (state, action: PayloadAction<DocClient[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchFollowUpClients.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Fetch Not Lifted
      .addCase(fetchNotLiftedClients.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotLiftedClients.fulfilled, (state, action: PayloadAction<DocClient[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchNotLiftedClients.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Fetch Call History
      .addCase(fetchCallHistory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCallHistory.fulfilled, (state, action: PayloadAction<CallResponse[]>) => {
        state.loading = false;
        state.callHistory = action.payload;
      })
      .addCase(fetchCallHistory.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // Update Client Status
      .addCase(updateClientStatus.fulfilled, (state, action: PayloadAction<DocClient>) => {
        const index = state.list.findIndex(c => c.clientId === action.payload.clientId);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })

      // Start Call
      .addCase(startClientCall.fulfilled, (state, action: PayloadAction<CallResponse>) => {
        state.activeCall = action.payload;
        const client = state.list.find(c => c.clientId === action.payload.clientId);
        if (client) client.callInProgress = true;
      })
      
      // End Call
      .addCase(endClientCall.fulfilled, (state, action: PayloadAction<CallResponse>) => {
        state.activeCall = null;
        const client = state.list.find(c => c.clientId === action.payload.clientId);
        if (client) client.callInProgress = false;
        state.callHistory.unshift(action.payload);
      });
  },
});

export const { clearDocClientsError } = docClientsSlice.actions;
export default docClientsSlice.reducer;