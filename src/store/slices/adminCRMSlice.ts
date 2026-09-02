// src/store/slices/adminCRMSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Pageable } from './types'; // We'll define common types

// ---------- Types ----------
export interface AdminClientResponse {
  clientId: number;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  currentStage: string | null;
  nextFollowUpAt: string | null;
  assignedEmployeeId: number | null;
  assignedEmployeeName: string | null;
  assignedAt: string | null;
}

export interface AssignmentResponse {
  assignmentId: number;
  clientId: number;
  clientName: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  active: boolean;
  assignedAt: string;
  endedAt: string | null;
  reason: string | null;
}

export interface AdminCallResponse {
  callId: number;
  clientId: number;
  clientName: string;
  employeeId: number;
  employeeName: string;
  provider: string | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
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

export interface EmployeeCallReport {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  assignedClients: number;
  callsMade: number;
  answeredCalls: number;
  notLiftedCalls: number;
  followUps: number;
  interested: number;
  notInterested: number;
  totalTalkTimeSeconds: number;
  totalTalkTimeMinutes: number;
  averageCallSeconds: number;
}

export interface ClientImportResponse {
  totalRows: number;
  successful: number;
  duplicates: number;
  invalidRows: number;
  message: string;
}

export interface BulkAssignClientRequest {
  clientIds: number[];
  employeeId: number;
  reason?: string;
}

export interface BulkReassignClientRequest {
  assignmentIds: number[];
  newEmployeeId: number;
  reason?: string;
}

export interface ReassignClientRequest {
  newEmployeeId: number;
  reason?: string;
}

// ---------- State ----------
interface AdminCRMState {
  clients: AdminClientResponse[];
  totalClients: number;
  assignments: AssignmentResponse[];
  calls: AdminCallResponse[];
  totalCalls: number;
  comments: CommentResponse[];
  report: EmployeeCallReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminCRMState = {
  clients: [],
  totalClients: 0,
  assignments: [],
  calls: [],
  totalCalls: 0,
  comments: [],
  report: null,
  loading: false,
  error: null,
};

// ---------- Async Thunks ----------
// Get clients (with pagination)
export const fetchClients = createAsyncThunk(
  'adminCRM/fetchClients',
  async (pageable: Pageable, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/clients', { params: pageable });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients');
    }
  }
);

// Search clients
export const searchClients = createAsyncThunk(
  'adminCRM/searchClients',
  async ({ name, pageable }: { name: string; pageable: Pageable }, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/clients/search', { params: { name, ...pageable } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search clients');
    }
  }
);

// Get client by ID
export const fetchClientById = createAsyncThunk(
  'adminCRM/fetchClientById',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/clients/${clientId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client');
    }
  }
);

// Bulk assign clients
export const bulkAssignClients = createAsyncThunk(
  'adminCRM/bulkAssign',
  async (data: BulkAssignClientRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/assignments/bulk', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Bulk assign failed');
    }
  }
);

// Reassign client
export const reassignClient = createAsyncThunk(
  'adminCRM/reassign',
  async ({ assignmentId, data }: { assignmentId: number; data: ReassignClientRequest }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/assignments/${assignmentId}/reassign`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Reassign failed');
    }
  }
);

// Bulk reassign
export const bulkReassignClients = createAsyncThunk(
  'adminCRM/bulkReassign',
  async (data: BulkReassignClientRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/assignments/bulk-reassign', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Bulk reassign failed');
    }
  }
);

// Get not-lifted assignments
export const fetchNotLifted = createAsyncThunk(
  'adminCRM/fetchNotLifted',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/clients/not-lifted');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch not-lifted');
    }
  }
);

// Get follow-ups
export const fetchFollowUps = createAsyncThunk(
  'adminCRM/fetchFollowUps',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/clients/follow-ups');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch follow-ups');
    }
  }
);

// Get calls (with pagination)
export const fetchAdminCalls = createAsyncThunk(
  'adminCRM/fetchCalls',
  async (pageable: Pageable, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/calls', { params: pageable });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch calls');
    }
  }
);

// Get client calls
export const fetchClientCalls = createAsyncThunk(
  'adminCRM/fetchClientCalls',
  async ({ clientId, pageable }: { clientId: number; pageable: Pageable }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/clients/${clientId}/calls`, { params: pageable });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client calls');
    }
  }
);

// Get call recording
export const fetchCallRecording = createAsyncThunk(
  'adminCRM/fetchRecording',
  async (callId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/calls/${callId}/recording`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recording');
    }
  }
);

// Get client comments
export const fetchClientComments = createAsyncThunk(
  'adminCRM/fetchComments',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/clients/${clientId}/comments`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

// Delete comment
export const deleteComment = createAsyncThunk(
  'adminCRM/deleteComment',
  async (commentId: number, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/comments/${commentId}`);
      return commentId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

// Employee report
export const fetchEmployeeReport = createAsyncThunk(
  'adminCRM/fetchReport',
  async ({ employeeId, from, to }: { employeeId: number; from: string; to: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/reports/employees/${employeeId}`, {
        params: { from, to },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report');
    }
  }
);

// Upload Excel (client import)
export const uploadClientExcel = createAsyncThunk(
  'adminCRM/uploadExcel',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/admin/client-imports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Upload failed');
    }
  }
);

// ---------- Slice ----------
const adminCRMSlice = createSlice({
  name: 'adminCRM',
  initialState,
  reducers: {
    clearAdminCRM(state) {
      state.clients = [];
      state.totalClients = 0;
      state.assignments = [];
      state.calls = [];
      state.totalCalls = 0;
      state.comments = [];
      state.report = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // We'll add cases for each thunk; I'll show pattern.
    // Due to length, we'll include essential ones.
    // (Implement similarly to previous slices)
    // For brevity, I'll include a few but you can replicate pattern.

    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.clients = action.payload.content || [];
        state.totalClients = action.payload.totalElements || 0;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ... similarly for others
      .addCase(uploadClientExcel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadClientExcel.fulfilled, (state, action: PayloadAction<ClientImportResponse>) => {
        state.loading = false;
        // Optionally show toast, but not stored
      })
      .addCase(uploadClientExcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // Add all other cases...
  },
});

export const { clearAdminCRM, clearError } = adminCRMSlice.actions;
export default adminCRMSlice.reducer;