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
  id?: number;
  callId?: number;
  clientId: number;
  clientName: string;
  answered?: boolean;
  startTime?: string;
  callTime?: string;
  endTime?: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
  status?: string;
  toNumber?: string;
  fromNumber?: string;
  callType?: string;
}

export interface DocumentResponse {
  documentId: number;
  documentType: string;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  status: string;
  uploadedAt: string | null;
}

export interface DocumentRequestResponse {
  requestId: number;
  clientId: number;
  clientName: string;
  shareToken: string;
  shareUrl: string;
  active: boolean;
  submitted: boolean;
  expiresAt: string | null;
  documents: DocumentResponse[];
}

export interface DocumentRequestPayload {
  clientId: number;
  expiresAt: string;
  documentTypes: string[];
}

export interface CommentResponse {
  id: number;
  clientId: number;
  employeeId: number;
  employeeName: string;
  comment: string;
  commentType: string;
  createdAt: string;
}

export interface CallHippoRecord {
  id: number;
  agentId: string | null;
  callTime: string;
  callType: string | null;
  clientId: number;
  clientName: string | null;
  durationSeconds: number | null;
  employeeCode: string | null;
  fromNumber: string | null;
  toNumber: string | null;
  status: string;
  recordingUrl: string | null;
}

export interface SearchDocClientsPayload {
  query?: string;
  period?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

interface DocClientsState {
  list: DocClient[];
  callHistory: CallResponse[];
  activeCall: CallResponse | null;
  myRequests: DocumentRequestResponse[];
  publicRequest: DocumentRequestResponse | null;
  comments: CommentResponse[];
  searchResults: DocClient[];
  searchTotal: number;
  isSearching: boolean;
  searchActive: boolean;
  clientCallHistory: CallHippoRecord[];
  isClientCallHistoryLoading: boolean;
  
  // NEW: CallHippo Availability States
  isCallHippoAvailable: boolean;
  isCallHippoStatusLoading: boolean;

  loading: boolean;
  error: string | null;
}

const initialState: DocClientsState = {
  list: [],
  callHistory: [],
  activeCall: null,
  myRequests: [],
  publicRequest: null,
  comments: [],
  searchResults: [],
  searchTotal: 0,
  isSearching: false,
  searchActive: false,
  clientCallHistory: [],
  isClientCallHistoryLoading: false,
  isCallHippoAvailable: false,
  isCallHippoStatusLoading: false,
  loading: false,
  error: null,
};

// ========================================================
// Async Thunks
// ========================================================
export const searchDocClients = createAsyncThunk(
  'docClients/search',
  async (params: SearchDocClientsPayload, { rejectWithValue }) => {
    try {
      const queryParams: Record<string, any> = { 
        page: params.page || 0, 
        size: params.size || 50 
      };

      if (params.query) {
        if (/^\d+$/.test(params.query)) {
          queryParams.clientId = params.query;
        } else {
          queryParams.name = params.query;
        }
      }

      if (params.period && params.period !== 'ALL' && params.period !== 'CUSTOM') {
        queryParams.period = params.period;
      }
      if (params.period === 'CUSTOM') {
        if (params.fromDate) queryParams.fromDate = params.fromDate;
        if (params.toDate) queryParams.toDate = params.toDate;
      }

      const response = await apiDev2.get('/doc/clients/search', { params: queryParams });
      return response.data; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchClientsByStatuses = createAsyncThunk(
  'docClients/fetchByStatuses',
  async (statuses: string[], { rejectWithValue }) => {
    try {
      const requests = statuses.map(status => apiDev2.get(`/doc/clients/status/${status}`));
      const responses = await Promise.all(requests);
      
      let combinedData: DocClient[] = [];
      responses.forEach(response => {
        if (Array.isArray(response.data)) {
          combinedData = combinedData.concat(response.data);
        } else if (response.data && Array.isArray(response.data.content)) {
          combinedData = combinedData.concat(response.data.content);
        }
      });
      return combinedData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients by status');
    }
  }
);

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

export const fetchCallHistory = createAsyncThunk(
  'docClients/fetchCallHistory',
  async (_, { rejectWithValue }) => {
    try {
      // Reverted back to original correct API endpoint
      const response = await apiDev2.get('/doc/calls');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch call history');
    }
  }
);

export const fetchClientCallHippoHistory = createAsyncThunk(
  'docClients/fetchClientCallHippoHistory',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get(`/callhippo/client/${clientId}/history`, { params: { page: 0, size: 20 } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client call history');
    }
  }
);

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

// NEW: CallHippo Availability Status Toggle
export const setCallHippoStatus = createAsyncThunk(
  'docClients/setCallHippoStatus',
  async (isAvailable: boolean, { rejectWithValue }) => {
    try {
      const endpoint = isAvailable ? '/callhippo/employee/available' : '/callhippo/employee/unavailable';
      const response = await apiDev2.patch(endpoint);
      return { isAvailable, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change CallHippo status');
    }
  }
);

// UPDATED: Start Client Call (Uses new CallHippo API)
export const startClientCall = createAsyncThunk(
  'docClients/startCall',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await apiDev2.post(`/callhippo/call/${clientId}`);
      return { clientId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start call');
    }
  }
);

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

export const fetchMyDocumentRequests = createAsyncThunk(
  'docClients/fetchMyDocumentRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get('/documents/my-requests');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch document requests');
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'docClients/uploadDocument',
  async ({ token, documentId, file }: { token: string; documentId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiDev2.post(`/documents/public/${token}/upload/${documentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Upload failed');
    }
  }
);

export const submitDocuments = createAsyncThunk(
  'docClients/submitDocuments',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await apiDev2.post(`/documents/public/${token}/submit`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Submission failed');
    }
  }
);

export const fetchClientComments = createAsyncThunk(
  'docClients/fetchComments',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get(`/doc/clients/${clientId}/comments`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

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
    clearDocClientsSearch: (state) => {
      state.searchActive = false;
      state.searchResults = [];
      state.searchTotal = 0;
      state.isSearching = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchDocClients.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchDocClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.isSearching = false;
        state.searchActive = true;
        state.searchResults = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
        state.searchTotal = action.payload?.totalElements || 0;
      })
      .addCase(searchDocClients.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })
      .addCase(fetchClientsByStatuses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClientsByStatuses.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
      })
      .addCase(fetchClientsByStatuses.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchDocClients.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDocClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
      })
      .addCase(fetchDocClients.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchFollowUpClients.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFollowUpClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
      })
      .addCase(fetchFollowUpClients.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchNotLiftedClients.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotLiftedClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
      })
      .addCase(fetchNotLiftedClients.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchCallHistory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCallHistory.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.callHistory = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
      })
      .addCase(fetchCallHistory.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      
      // CallHippo Reducers
      .addCase(fetchClientCallHippoHistory.pending, (state) => {
        state.isClientCallHistoryLoading = true;
      })
      .addCase(fetchClientCallHippoHistory.fulfilled, (state, action: PayloadAction<any>) => {
        state.isClientCallHistoryLoading = false;
        state.clientCallHistory = action.payload?.content || [];
      })
      .addCase(fetchClientCallHippoHistory.rejected, (state, action) => {
        state.isClientCallHistoryLoading = false;
        state.error = action.payload as string;
      })
      
      // NEW: Set CallHippo Status
      .addCase(setCallHippoStatus.pending, (state) => {
        state.isCallHippoStatusLoading = true;
      })
      .addCase(setCallHippoStatus.fulfilled, (state, action) => {
        state.isCallHippoStatusLoading = false;
        state.isCallHippoAvailable = action.payload.isAvailable;
      })
      .addCase(setCallHippoStatus.rejected, (state, action) => {
        state.isCallHippoStatusLoading = false;
        state.error = action.payload as string;
      })

      .addCase(updateClientStatus.fulfilled, (state, action: PayloadAction<DocClient>) => {
        const index = state.list.findIndex(c => c.clientId === action.payload.clientId);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.searchActive) {
          const sIndex = state.searchResults.findIndex(c => c.clientId === action.payload.clientId);
          if (sIndex !== -1) state.searchResults[sIndex] = action.payload;
        }
      })
      
      // UPDATED: Handle new CallHippo start call payload
      .addCase(startClientCall.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(startClientCall.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const clientId = action.payload.clientId;
        const client = state.list.find(c => c.clientId === clientId);
        
        state.activeCall = {
          callId: action.payload.callHistoryId || 0,
          clientId: clientId,
          clientName: client ? client.name : 'Unknown',
          answered: false,
          startTime: new Date().toISOString(),
          endTime: null,
          durationSeconds: null,
          recordingUrl: null,
          status: action.payload.status || 'INITIATED'
        };

        if (client) client.callInProgress = true;
        if (state.searchActive) {
          const sClient = state.searchResults.find(c => c.clientId === clientId);
          if (sClient) sClient.callInProgress = true;
        }
      })
      .addCase(startClientCall.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(endClientCall.fulfilled, (state, action: PayloadAction<CallResponse>) => {
        state.activeCall = null;
        const client = state.list.find(c => c.clientId === action.payload.clientId);
        if (client) client.callInProgress = false;
        if (state.searchActive) {
          const sClient = state.searchResults.find(c => c.clientId === action.payload.clientId);
          if (sClient) sClient.callInProgress = false;
        }
        state.callHistory.unshift(action.payload);
      })
      .addCase(requestClientDocuments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(requestClientDocuments.fulfilled, (state, action: PayloadAction<DocumentRequestResponse>) => {
        state.loading = false;
        state.myRequests.unshift(action.payload);
      })
      .addCase(requestClientDocuments.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchPublicDocuments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPublicDocuments.fulfilled, (state, action: PayloadAction<DocumentRequestResponse>) => {
        state.loading = false;
        state.publicRequest = action.payload;
      })
      .addCase(fetchPublicDocuments.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchMyDocumentRequests.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyDocumentRequests.fulfilled, (state, action: PayloadAction<DocumentRequestResponse[]>) => {
        state.loading = false;
        state.myRequests = action.payload;
      })
      .addCase(fetchMyDocumentRequests.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(uploadDocument.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(uploadDocument.fulfilled, (state, action: PayloadAction<DocumentResponse>) => {
        state.loading = false;
        const doc = action.payload;
        if (state.currentRequest) {
          const idx = state.currentRequest.documents.findIndex(d => d.documentId === doc.documentId);
          if (idx !== -1) state.currentRequest.documents[idx] = doc;
        }
        if (state.publicRequest) {
          const idx = state.publicRequest.documents.findIndex(d => d.documentId === doc.documentId);
          if (idx !== -1) state.publicRequest.documents[idx] = doc;
        }
      })
      .addCase(uploadDocument.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(submitDocuments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitDocuments.fulfilled, (state, action: PayloadAction<DocumentRequestResponse>) => {
        state.loading = false;
        state.publicRequest = action.payload;
      })
      .addCase(submitDocuments.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchClientComments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClientComments.fulfilled, (state, action: PayloadAction<CommentResponse[]>) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchClientComments.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(postClientComment.fulfilled, (state, action: PayloadAction<CommentResponse>) => {
        state.comments.unshift(action.payload);
      });
  },
});

export const { clearDocClientsError, clearDocClientsSearch } = docClientsSlice.actions;
export default docClientsSlice.reducer;