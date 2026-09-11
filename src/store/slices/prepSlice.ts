// src/store/slices/prepSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface PrepDocument {
  documentId: number;
  documentType: string;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  status: string;
  uploadedAt: string;
}

export interface PrepDraft {
  draftId: number;
  draftVersion: number;
  fileName: string | null;
  prepRemarks: string | null;
  adminFeedback: string | null;
  status: string;
  uploadedAt: string;
  prepEmployeeName: string;
}

export interface PrepClient {
  assignmentId: number;
  clientId: number;
  clientName: string;
  status: string;
  assignedBy: string;
  assignedAt: string;
  documents: PrepDocument[];
  phone?: string;
  email?: string;
  ssn?: string;
  visaStatus?: string;
  taxYear?: string;
}

// ============================================================
// Reassign request/response types (within Prep)
// ============================================================
export interface ReassignPrepRequest {
  newEmployeeId: number;
  reason?: string;
}

export interface BulkReassignPrepRequest {
  assignmentIds: number[];
  newEmployeeId: number;
  reason?: string;
}

export interface PrepAssignmentResponse {
  assignmentId: number;
  clientId: number;
  clientName: string;
  prepEmployeeId: number;
  prepEmployeeName: string;
  status: string;
  documents: PrepDocument[];
}

// ============================================================
// AdminClientResponseDto (for bulkAssignToPreparation)
// ============================================================
export interface AdminClientResponseDto {
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

// ============================================================
// EXISTING THUNKS
// ============================================================
export const fetchPrepClients = createAsyncThunk(
  'prep/fetchClients',
  async (params: { page?: number; size?: number } = { page: 0, size: 50 }, { rejectWithValue }) => {
    try {
      const response = await api.get('/prep/clients', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch preparation clients');
    }
  }
);

export const fetchReadyForReviewClients = createAsyncThunk(
  'prep/fetchReadyForReviewClients',
  async (params: { page?: number; size?: number } = { page: 0, size: 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get('/prep/clients/ready-for-review', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ready for review clients');
    }
  }
);

export const submitPrepDraft = createAsyncThunk(
  'prep/submitDraft',
  async ({ assignmentId, file, remarks }: { assignmentId: number; file: File; remarks?: string }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/prep/clients/${assignmentId}/submit-draft`, formData, {
        params: remarks ? { remarks } : undefined,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit draft');
    }
  }
);

export const fetchClientDrafts = createAsyncThunk(
  'prep/fetchClientDrafts',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/prep/clients/${clientId}/drafts`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch drafts');
    }
  }
);

export const viewPrepDraft = createAsyncThunk(
  'prep/viewDraft',
  async (draftId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/prep/drafts/${draftId}/view`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch draft');
    }
  }
);

// ============================================================
// NEW: Reassign a single prep client (within Prep)
// POST /prep/assignments/prep/{assignmentId}/reassign
// ============================================================
export const reassignPrepClient = createAsyncThunk(
  'prep/reassignSingle',
  async ({ assignmentId, data }: { assignmentId: number; data: ReassignPrepRequest }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/prep/assignments/prep/${assignmentId}/reassign`, data);
      return response.data; // PrepAssignmentResponseDto
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reassign prep client');
    }
  }
);

// ============================================================
// NEW: Bulk reassign prep clients (within Prep)
// POST /prep/assignments/prep/bulk-reassign
// ============================================================
export const bulkReassignPrepClients = createAsyncThunk(
  'prep/bulkReassign',
  async (data: BulkReassignPrepRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/prep/assignments/prep/bulk-reassign', data);
      return response.data; // List<PrepAssignmentResponseDto>
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk reassign prep clients');
    }
  }
);

// ============================================================
// NEW: Review a tax draft (Approve/Reject)
// PUT /prep/drafts/{draftId}/review
// ============================================================
export const reviewTaxDraft = createAsyncThunk(
  'prep/reviewDraft',
  async ({ draftId, isApproved, feedback }: { draftId: number; isApproved: boolean; feedback?: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/prep/drafts/${draftId}/review`, null, {
        params: { isApproved, feedback },
      });
      return response.data; // AdminClientResponseDto
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to review draft');
    }
  }
);

// ============================================================
// ✅ NEW: Move client(s) from Doc/current team to Preparation
// POST /prep/clients/bulk-assign-prep
// ============================================================
export const bulkAssignToPreparation = createAsyncThunk(
  'prep/bulkAssignToPreparation',
  async (payload: { clientIds: number[]; prepEmployeeId: number }, { rejectWithValue }) => {
    try {
      const response = await api.post('/prep/clients/bulk-assign-prep', payload);
      return response.data; // List<AdminClientResponseDto>
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign clients to preparation');
    }
  }
);

// ============================================================
// SLICE
// ============================================================
interface PrepState {
  list: PrepClient[];
  loading: boolean;
  error: string | null;
  reassignResult: PrepAssignmentResponse | null;
  bulkReassignResults: PrepAssignmentResponse[];
  moveToPrepResult: AdminClientResponseDto[]; // ✅ NEW: stores result of bulkAssignToPreparation
}

const initialState: PrepState = {
  list: [],
  loading: false,
  error: null,
  reassignResult: null,
  bulkReassignResults: [],
  moveToPrepResult: [], // ✅ NEW
};

const prepSlice = createSlice({
  name: 'prep',
  initialState,
  reducers: {
    clearPrepError: (state) => {
      state.error = null;
    },
    clearReassignResults: (state) => {
      state.reassignResult = null;
      state.bulkReassignResults = [];
    },
    // ✅ NEW: clear move-to-prep result
    clearMoveToPrepResult: (state) => {
      state.moveToPrepResult = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- fetchPrepClients ----------
      .addCase(fetchPrepClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrepClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
      })
      .addCase(fetchPrepClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Ready For Review Clients
      .addCase(fetchReadyForReviewClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReadyForReviewClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
      })
      .addCase(fetchReadyForReviewClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Submit Draft

      // ---------- submitPrepDraft ----------
      .addCase(submitPrepDraft.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPrepDraft.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitPrepDraft.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- reassignPrepClient ----------
      .addCase(reassignPrepClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reassignPrepClient.fulfilled, (state, action: PayloadAction<PrepAssignmentResponse>) => {
        state.loading = false;
        state.reassignResult = action.payload;
      })
      .addCase(reassignPrepClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- bulkReassignPrepClients ----------
      .addCase(bulkReassignPrepClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkReassignPrepClients.fulfilled, (state, action: PayloadAction<PrepAssignmentResponse[]>) => {
        state.loading = false;
        state.bulkReassignResults = action.payload;
      })
      .addCase(bulkReassignPrepClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- reviewTaxDraft ----------
      .addCase(reviewTaxDraft.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reviewTaxDraft.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(reviewTaxDraft.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- ✅ bulkAssignToPreparation ----------
      .addCase(bulkAssignToPreparation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkAssignToPreparation.fulfilled, (state, action: PayloadAction<AdminClientResponseDto[]>) => {
        state.loading = false;
        state.moveToPrepResult = action.payload;
      })
      .addCase(bulkAssignToPreparation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPrepError, clearReassignResults, clearMoveToPrepResult } = prepSlice.actions;
export default prepSlice.reducer;