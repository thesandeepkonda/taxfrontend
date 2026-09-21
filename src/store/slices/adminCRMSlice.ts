// src/store/slices/adminCRMSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Pageable } from './types';

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

// ---------- Document Types (matching backend) ----------
export interface AdminDocumentResponse {
  documentId: number;
  clientId: number;
  clientName: string;
  documentType: string;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  status: string; // PENDING, SUBMITTED, VERIFIED, REJECTED
  fileUrl: string;
  uploadedAt: string | null;
  updatedAt: string | null;
}

// ✅ NEW: Extended pageable type with optional stage filter
export interface FetchClientsParams extends Pageable {
  stage?: string; // 'DOC' | 'PREP' | 'ESTIMATION' | 'PAYMENT' | 'EFILING' | etc.
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
  clientDocuments: AdminDocumentResponse[];
  totalClientDocuments: number;

  // ✅ Client assignment history
  clientAssignmentHistory: AssignmentResponse[];

  // ✅ Unassigned clients (from /admin/unassigned)
  unassignedClients: AdminClientResponse[];
  unassignedTotal: number;

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
  clientDocuments: [],
  totalClientDocuments: 0,

  clientAssignmentHistory: [],

  unassignedClients: [],
  unassignedTotal: 0,

  loading: false,
  error: null,
};

// ---------- Async Thunks ----------

// ✅ UPDATED: fetchClients — now supports optional `stage` filter
export const fetchClients = createAsyncThunk(
  'adminCRM/fetchClients',
  async (params: FetchClientsParams, { rejectWithValue }) => {
    try {
      const { stage, ...pageable } = params;
      const queryParams: Record<string, any> = { ...pageable };
      if (stage) queryParams.stage = stage;

      const response = await api.get('/admin/clients', { params: queryParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients');
    }
  }
);

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

export const fetchClientsByEmployee = createAsyncThunk(
  'adminCRM/fetchClientsByEmployee',
  async ({ employeeId, pageable }: { employeeId: number; pageable: Pageable }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/employees/${employeeId}/clients`, { params: pageable });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients for employee');
    }
  }
);

export const fetchClientDocumentsByClientId = createAsyncThunk(
  'adminCRM/fetchClientDocumentsByClientId',
  async ({ clientId, pageable }: { clientId: number; pageable: Pageable }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/clients/${clientId}/documents`, { params: pageable });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client documents');
    }
  }
);

// ---------- Document Approve / Reject ----------
export const approveDocument = createAsyncThunk(
  'adminCRM/approveDocument',
  async ({ clientId, documentId }: { clientId: number; documentId: number }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/clients/${clientId}/documents/${documentId}/approve`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve document');
    }
  }
);

export const rejectDocument = createAsyncThunk(
  'adminCRM/rejectDocument',
  async ({ clientId, documentId, comment }: { clientId: number; documentId: number; comment: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/clients/${clientId}/documents/${documentId}/reject`, { comment });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject document');
    }
  }
);

export const approveAllDocuments = createAsyncThunk(
  'adminCRM/approveAllDocuments',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/clients/${clientId}/documents/approve`);
      return { clientId, documents: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve all documents');
    }
  }
);

export const rejectAllDocuments = createAsyncThunk(
  'adminCRM/rejectAllDocuments',
  async ({ clientId, comment }: { clientId: number; comment: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/clients/${clientId}/documents/reject`, { comment });
      return { clientId, documents: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject all documents');
    }
  }
);

export const updateClientStatus = createAsyncThunk(
  'adminCRM/updateClientStatus',
  async ({ clientId, status }: { clientId: number; status: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/clients/${clientId}/status`, { status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update client status');
    }
  }
);

export const editComment = createAsyncThunk(
  'adminCRM/editComment',
  async ({ commentId, comment }: { commentId: number; comment: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/comments/${commentId}`, { comment });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to edit comment');
    }
  }
);

export const fetchClientsByStatus = createAsyncThunk(
  'adminCRM/fetchClientsByStatus',
  async (status: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/clients/status/${status}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients by status');
    }
  }
);

// ============================================================
// GET /admin/clients/{clientId}/history
// ============================================================
export const fetchClientAssignmentHistory = createAsyncThunk(
  'adminCRM/fetchClientAssignmentHistory',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/clients/${clientId}/history`);
      return response.data as AssignmentResponse[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch client assignment history'
      );
    }
  }
);

// ============================================================
// GET /admin/unassigned (paginated)
// ============================================================
export const fetchUnassignedClients = createAsyncThunk<
  { data: any; page: number; append: boolean },
  { page?: number; size?: number; append?: boolean },
  { rejectValue: string }
>(
  'adminCRM/fetchUnassignedClients',
  async (
    { page = 0, size = 20, append = false },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/admin/unassigned', {
        params: { page, size },
      });
      return { data: response.data, page, append };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch unassigned clients'
      );
    }
  }
);

// ============================================================
// ✅ BONUS THUNK: GET /admin?stage={stage} (base /admin endpoint)
// ============================================================
export const fetchClientsByStage = createAsyncThunk<
  any,
  { stage?: string; page?: number; size?: number; append?: boolean },
  { rejectValue: string }
>(
  'adminCRM/fetchClientsByStage',
  async ({ stage, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      const params: Record<string, any> = { page, size };
      if (stage) params.stage = stage;
      const response = await api.get('/admin', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch clients by stage'
      );
    }
  }
);

// ============================================================
// Document Viewer Helper
// ============================================================
export const viewAdminDocument = async (documentId: number) => {
  try {
    const response = await api.get(`/documents/admin/view/${documentId}`, {
      responseType: 'blob',
    });
    const file = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/pdf',
    });
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL, '_blank');
    return true;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to view document');
  }
};

// ---------- Slice ----------
const adminCRMSlice = createSlice({
  name: 'adminCRM',
  initialState,
  reducers: {
    clearAdminCRM: (state) => {
      state.clients = [];
      state.totalClients = 0;
      state.assignments = [];
      state.calls = [];
      state.totalCalls = 0;
      state.comments = [];
      state.report = null;
      state.clientDocuments = [];
      state.totalClientDocuments = 0;
      state.clientAssignmentHistory = [];
      state.unassignedClients = [];
      state.unassignedTotal = 0;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearClientDocuments: (state) => {
      state.clientDocuments = [];
      state.totalClientDocuments = 0;
    },
    clearClientAssignmentHistory: (state) => {
      state.clientAssignmentHistory = [];
    },
    clearUnassignedClients: (state) => {
      state.unassignedClients = [];
      state.unassignedTotal = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- fetchClients ----------
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

      // ---------- fetchClientComments ----------
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

      // ---------- deleteComment ----------
      .addCase(deleteComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.comments = state.comments.filter(c => c.id !== action.payload);
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchAdminCalls ----------
      .addCase(fetchAdminCalls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminCalls.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.calls = action.payload.content || [];
        state.totalCalls = action.payload.totalElements || 0;
      })
      .addCase(fetchAdminCalls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchCallRecording ----------
      .addCase(fetchCallRecording.fulfilled, (state, action: PayloadAction<AdminCallResponse>) => {
        // No state change
      })

      // ---------- fetchEmployeeReport ----------
      .addCase(fetchEmployeeReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeReport.fulfilled, (state, action: PayloadAction<EmployeeCallReport>) => {
        state.loading = false;
        state.report = action.payload;
      })
      .addCase(fetchEmployeeReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- uploadClientExcel ----------
      .addCase(uploadClientExcel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadClientExcel.fulfilled, (state, action: PayloadAction<ClientImportResponse>) => {
        state.loading = false;
      })
      .addCase(uploadClientExcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- bulkAssignClients, reassignClient ----------
      .addCase(bulkAssignClients.fulfilled, (state) => {})
      .addCase(reassignClient.fulfilled, (state) => {})

      // ---------- fetchClientsByEmployee ----------
      .addCase(fetchClientsByEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientsByEmployee.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.clients = action.payload.content || [];
        state.totalClients = action.payload.totalElements || 0;
      })
      .addCase(fetchClientsByEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchClientDocumentsByClientId ----------
      .addCase(fetchClientDocumentsByClientId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientDocumentsByClientId.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.clientDocuments = action.payload.content || [];
        state.totalClientDocuments = action.payload.totalElements || 0;
      })
      .addCase(fetchClientDocumentsByClientId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- updateClientStatus ----------
      .addCase(updateClientStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClientStatus.fulfilled, (state, action: PayloadAction<AdminClientResponse>) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.clients.findIndex(c => c.clientId === updated.clientId);
        if (index !== -1) {
          state.clients[index] = updated;
        }
      })
      .addCase(updateClientStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- editComment ----------
      .addCase(editComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editComment.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.comments.findIndex(c => c.id === updated.id);
        if (index !== -1) {
          state.comments[index] = {
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

      // ---------- fetchClientsByStatus ----------
      .addCase(fetchClientsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientsByStatus.fulfilled, (state, action: PayloadAction<AdminClientResponse[]>) => {
        state.loading = false;
        state.clients = action.payload;
        state.totalClients = action.payload.length;
      })
      .addCase(fetchClientsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- Document Approve / Reject ----------
      .addCase(approveDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveDocument.fulfilled, (state, action: PayloadAction<AdminDocumentResponse>) => {
        state.loading = false;
        const updatedDoc = action.payload;
        const index = state.clientDocuments.findIndex((doc) => doc.documentId === updatedDoc.documentId);
        if (index !== -1) {
          state.clientDocuments[index] = updatedDoc;
        }
      })
      .addCase(approveDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(rejectDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectDocument.fulfilled, (state, action: PayloadAction<AdminDocumentResponse>) => {
        state.loading = false;
        const updatedDoc = action.payload;
        const index = state.clientDocuments.findIndex((doc) => doc.documentId === updatedDoc.documentId);
        if (index !== -1) {
          state.clientDocuments[index] = updatedDoc;
        }
      })
      .addCase(rejectDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(approveAllDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveAllDocuments.fulfilled, (state, action: PayloadAction<{ clientId: number; documents: AdminDocumentResponse[] }>) => {
        state.loading = false;
        state.clientDocuments = action.payload.documents;
      })
      .addCase(approveAllDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(rejectAllDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectAllDocuments.fulfilled, (state, action: PayloadAction<{ clientId: number; documents: AdminDocumentResponse[] }>) => {
        state.loading = false;
        state.clientDocuments = action.payload.documents;
      })
      .addCase(rejectAllDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================================
      // fetchClientAssignmentHistory
      // ============================================================
      .addCase(fetchClientAssignmentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientAssignmentHistory.fulfilled, (state, action: PayloadAction<AssignmentResponse[]>) => {
        state.loading = false;
        state.clientAssignmentHistory = action.payload;
      })
      .addCase(fetchClientAssignmentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================================
      // fetchUnassignedClients
      // ============================================================
      .addCase(fetchUnassignedClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnassignedClients.fulfilled, (state, action) => {
        state.loading = false;
        const pageData = action.payload.data || {};
        const content: AdminClientResponse[] = pageData.content || [];
        const totalElements: number = pageData.totalElements || 0;

        if (action.payload.append) {
          const existingIds = new Set(state.unassignedClients.map((c) => c.clientId));
          const newUnique = content.filter((c) => !existingIds.has(c.clientId));
          state.unassignedClients = [...state.unassignedClients, ...newUnique];
        } else {
          state.unassignedClients = content;
        }
        state.unassignedTotal = totalElements;
      })
      .addCase(fetchUnassignedClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================================
      // BONUS: fetchClientsByStage
      // ============================================================
      .addCase(fetchClientsByStage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientsByStage.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.clients = action.payload?.content || [];
        state.totalClients = action.payload?.totalElements || 0;
      })
      .addCase(fetchClientsByStage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearAdminCRM,
  clearError,
  clearClientDocuments,
  clearClientAssignmentHistory,
  clearUnassignedClients,
} = adminCRMSlice.actions;

export default adminCRMSlice.reducer;