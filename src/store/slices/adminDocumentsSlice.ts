// src/store/slices/adminDocumentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { DocumentRequestResponse, DocumentResponse } from './documentSlice';

// ============================================================
// ✅ Types from OpenAPI
// ============================================================

export interface AdminClientDocumentStatusDto {
  clientId: number;
  name: string;
  email: string | null;
  phone: string;
  totalDocuments: number;
  submittedDocuments: number;
  pendingDocuments: number;
  documentStatus: string;
  currentStage?: string | null;
  status?: string | null;
}

export interface AdminDocumentSummaryDto {
  totalClients: number;
  submittedClients: number;
  pendingClients: number;
  totalDocuments: number;
  submittedDocuments: number;
}

export interface AdminDocumentResponseDto {
  documentId: number;
  clientId: number;
  clientName: string;
  documentType: string;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  status: string;
  fileUrl: string;
  uploadedAt: string | null;
  updatedAt: string | null;
  reviewComment?: string | null;
  reviewedById?: number | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
}

// ============================================================
// ✅ NEW: CallHippo related types (5 APIs)
// ============================================================

// 1. Client Call History item
export interface CallHippoClientHistoryItem {
  id: number;
  clientId: number;
  clientName: string | null;
  userId: number;
  employeeCode: string | null;
  employeeName: string | null;
  agentId: string | null;
  callSid: string | null;
  callType: string | null;
  status: string;
  fromNumber: string | null;
  toNumber: string | null;
  duration: string | null;
  durationSeconds: number | null;
  durationMinutes: number;
  callTime: string;
  startTime: string | null;
  endTime: string | null;
  recordingUrl: string | null;
  hangupBy: string | null;
  answeredDevice: string | null;
  billedMinutes: number | null;
  callCharge: string | null;
  countryName: string | null;
}

// 2. Embedded config
export interface CallHippoEmbeddedConfig {
  token: string;
  email: string;
  agentId: string | null;
}

// 3. Admin call report — single call detail
export interface AdminCallReportCallDetail {
  callHistoryId: number;
  clientId: number;
  clientName: string | null;
  employeeCode: string | null;
  employeeName: string | null;
  userId: number;
  agentId: string | null;
  callSid: string | null;
  fromNumber: string | null;
  toNumber: string | null;
  callType: string | null;
  status: string | null;
  duration: string | null;
  durationSeconds: number | null;
  billedMinutes: number | null;
  callCharge: string | null;
  recordingUrl: string | null;
  hangupBy: string | null;
  answeredDevice: string | null;
  countryName: string | null;
  callTime: string | null;
  startTime: string | null;
  endTime: string | null;
}

// 4. Activity feed response
export interface CallHippoActivityFeedCallLog {
  _id: string;
  callSid: string;
  callType: string;
  from: string;
  to: string;
  date: string;
  time: string;
  callDuration: string;
  totalCallDuration: number;
  ringingDuration: string;
  callCost: number;
  caller: string;
  callerEmail: string;
  callStatus: string;
  recordingUrl: string;
  hangupBy: string;
  crmUniqueId: string;
  // ...other fields as needed
}

export interface CallHippoActivityFeedResponse {
  success: boolean;
  data: {
    callLogs: CallHippoActivityFeedCallLog | CallHippoActivityFeedCallLog[];
    hasNext: boolean;
  };
}

export interface CallHippoActivityFeedRequest {
  skip: string;
  limit: string;
  startDate: string; // "2026/09/01"
  endDate: string;   // "2026/09/19"
  crmUniqueId: string;
  callSid: string;
}

// 5. WhatsApp link response
export interface WhatsAppLinkResponse {
  success: boolean;
  url: string;
}

// ---------- State ----------
interface AdminDocumentsState {
  requests: DocumentRequestResponse[];
  viewingDocument: DocumentResponse | null;

  verifiedClients: AdminClientDocumentStatusDto[];
  verifiedTotal: number;
  verifiedPage: number;

  submittedClients: AdminClientDocumentStatusDto[];
  submittedTotal: number;
  submittedPage: number;

  pendingClients: AdminClientDocumentStatusDto[];
  pendingTotal: number;
  pendingPage: number;

  summary: AdminDocumentSummaryDto | null;
  currentDocument: AdminDocumentResponseDto | null;

  // ============================================================
  // ✅ NEW: CallHippo state
  // ============================================================
  clientCallHistory: CallHippoClientHistoryItem[];
  clientCallHistoryTotal: number;
  clientCallHistoryPage: number;
  clientCallHistoryHasMore: boolean;

  embeddedConfig: CallHippoEmbeddedConfig | null;

  adminCallReport: AdminCallReportCallDetail[];
  adminCallReportTotal: number;
  adminCallReportPage: number;
  adminCallReportHasMore: boolean;

  activityFeed: CallHippoActivityFeedResponse | null;

  whatsAppLink: string | null;

  isCallHippoLoading: boolean;

  loading: boolean;
  error: string | null;
}

const initialState: AdminDocumentsState = {
  requests: [],
  viewingDocument: null,

  verifiedClients: [],
  verifiedTotal: 0,
  verifiedPage: 0,

  submittedClients: [],
  submittedTotal: 0,
  submittedPage: 0,

  pendingClients: [],
  pendingTotal: 0,
  pendingPage: 0,

  summary: null,
  currentDocument: null,

  // ✅ NEW
  clientCallHistory: [],
  clientCallHistoryTotal: 0,
  clientCallHistoryPage: 0,
  clientCallHistoryHasMore: true,

  embeddedConfig: null,

  adminCallReport: [],
  adminCallReportTotal: 0,
  adminCallReportPage: 0,
  adminCallReportHasMore: true,

  activityFeed: null,

  whatsAppLink: null,

  isCallHippoLoading: false,

  loading: false,
  error: null,
};

// ============================================================
// EXISTING THUNKS
// ============================================================

export const fetchAllDocumentRequests = createAsyncThunk(
  'adminDocuments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/documents/requests');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch document requests');
    }
  }
);

export const verifyDocument = createAsyncThunk(
  'adminDocuments/verify',
  async ({ documentId, remarks }: { documentId: number; remarks?: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/documents/${documentId}/verify`, { remarks });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify document');
    }
  }
);

export const viewDocument = async (documentId: number) => {
  try {
    const response = await api.get(`/documents/admin/view/${documentId}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    window.open(url, '_blank');
    return true;
  } catch (error: any) {
    console.error('View document error:', error);
    throw new Error(error.response?.data?.message || 'Failed to view document');
  }
};

// ============================================================
// ✅ Paginated THUNKS
// ============================================================

export const fetchVerifiedDocumentClients = createAsyncThunk(
  'adminDocuments/fetchVerified',
  async (
    { page = 0, size = 10 }: { page?: number; size?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/admin/documents/verified', {
        params: { page, size },
      });
      return { data: response.data, page };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch verified document clients'
      );
    }
  }
);

export const fetchDocumentSummary = createAsyncThunk(
  'adminDocuments/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/documents/summary');
      return response.data as AdminDocumentSummaryDto;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch document summary'
      );
    }
  }
);

export const fetchSubmittedDocumentClients = createAsyncThunk(
  'adminDocuments/fetchSubmittedClients',
  async (
    { page = 0, size = 20 }: { page?: number; size?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/admin/clients/documents/submitted', {
        params: { page, size },
      });
      return { data: response.data, page };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch submitted document clients'
      );
    }
  }
);

export const fetchPendingDocumentClients = createAsyncThunk(
  'adminDocuments/fetchPendingClients',
  async (
    { page = 0, size = 20 }: { page?: number; size?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/admin/clients/documents/pending', {
        params: { page, size },
      });
      return { data: response.data, page };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch pending document clients'
      );
    }
  }
);

export const fetchAdminDocumentById = createAsyncThunk(
  'adminDocuments/fetchById',
  async (documentId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/documents/${documentId}`);
      return response.data as AdminDocumentResponseDto;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch document'
      );
    }
  }
);

// ============================================================
// ✅ NEW: CallHippo THUNKS (5 APIs)
// ============================================================

// 1. GET /api/callhippo/client/{clientId}/history?page=&size=
export const fetchCallHippoClientHistory = createAsyncThunk(
  'adminDocuments/fetchCallHippoClientHistory',
  async (
    { clientId, page = 0, size = 20, append = false }: {
      clientId: number;
      page?: number;
      size?: number;
      append?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(`/callhippo/client/${clientId}/history`, {
        params: { page, size },
      });
      return { data: response.data, page, append };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch client call history'
      );
    }
  }
);

// 2. GET /api/callhippo/embedded/config
export const fetchCallHippoEmbeddedConfig = createAsyncThunk(
  'adminDocuments/fetchCallHippoEmbeddedConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/callhippo/embedded/config');
      return response.data as CallHippoEmbeddedConfig;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch CallHippo embedded config'
      );
    }
  }
);

// 3. GET /api/callhippo/admin/call-report/employees/{empId}/clients/{clientId}/calls
export const fetchAdminCallReportCalls = createAsyncThunk(
  'adminDocuments/fetchAdminCallReportCalls',
  async (
    {
      employeeId,
      clientId,
      page = 0,
      size = 20,
      startDate,
      endDate,
      append = false,
    }: {
      employeeId: number;
      clientId: number;
      page?: number;
      size?: number;
      startDate?: string;
      endDate?: string;
      append?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const params: Record<string, any> = { page, size };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(
        `/callhippo/admin/call-report/employees/${employeeId}/clients/${clientId}/calls`,
        { params }
      );
      return { data: response.data, page, append };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch admin call report'
      );
    }
  }
);

// 4. POST /api/callhippo/activityfeed
export const fetchCallHippoActivityFeed = createAsyncThunk(
  'adminDocuments/fetchCallHippoActivityFeed',
  async (payload: CallHippoActivityFeedRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/callhippo/activityfeed', payload);
      return response.data as CallHippoActivityFeedResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch CallHippo activity feed'
      );
    }
  }
);

// 5. GET /api/callhippo/whatsapp/{clientId}
export const fetchWhatsAppLink = createAsyncThunk(
  'adminDocuments/fetchWhatsAppLink',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/callhippo/whatsapp/${clientId}`);
      return response.data as WhatsAppLinkResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch WhatsApp link'
      );
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const adminDocumentsSlice = createSlice({
  name: 'adminDocuments',
  initialState,
  reducers: {
    clearAdminDocuments(state) {
      state.requests = [];
      state.viewingDocument = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearVerifiedClients(state) {
      state.verifiedClients = [];
      state.verifiedTotal = 0;
      state.verifiedPage = 0;
    },
    clearSubmittedClients(state) {
      state.submittedClients = [];
      state.submittedTotal = 0;
      state.submittedPage = 0;
    },
    clearPendingClients(state) {
      state.pendingClients = [];
      state.pendingTotal = 0;
      state.pendingPage = 0;
    },
    clearDocumentSummary(state) {
      state.summary = null;
    },
    clearCurrentDocument(state) {
      state.currentDocument = null;
    },
    // ✅ NEW: CallHippo clear reducers
    clearClientCallHistory(state) {
      state.clientCallHistory = [];
      state.clientCallHistoryTotal = 0;
      state.clientCallHistoryPage = 0;
      state.clientCallHistoryHasMore = true;
    },
    clearAdminCallReport(state) {
      state.adminCallReport = [];
      state.adminCallReportTotal = 0;
      state.adminCallReportPage = 0;
      state.adminCallReportHasMore = true;
    },
    clearActivityFeed(state) {
      state.activityFeed = null;
    },
    clearWhatsAppLink(state) {
      state.whatsAppLink = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- fetchAllDocumentRequests ----------
      .addCase(fetchAllDocumentRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDocumentRequests.fulfilled, (state, action: PayloadAction<DocumentRequestResponse[]>) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchAllDocumentRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- verifyDocument ----------
      .addCase(verifyDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyDocument.fulfilled, (state, action: PayloadAction<DocumentResponse>) => {
        state.loading = false;
        const updatedDoc = action.payload;
        state.requests = state.requests.map((req) => ({
          ...req,
          documents: req.documents.map((doc) =>
            doc.documentId === updatedDoc.documentId ? updatedDoc : doc
          ),
        }));
      })
      .addCase(verifyDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchVerifiedDocumentClients ----------
      .addCase(fetchVerifiedDocumentClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVerifiedDocumentClients.fulfilled, (state, action: PayloadAction<{ data: any; page: number }>) => {
        state.loading = false;
        const pageData = action.payload.data;
        state.verifiedClients = pageData.content || [];
        state.verifiedTotal = pageData.totalElements || 0;
        state.verifiedPage = action.payload.page;
      })
      .addCase(fetchVerifiedDocumentClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchDocumentSummary ----------
      .addCase(fetchDocumentSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentSummary.fulfilled, (state, action: PayloadAction<AdminDocumentSummaryDto>) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDocumentSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchSubmittedDocumentClients ----------
      .addCase(fetchSubmittedDocumentClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmittedDocumentClients.fulfilled, (state, action: PayloadAction<{ data: any; page: number }>) => {
        state.loading = false;
        const pageData = action.payload.data;
        state.submittedClients = pageData.content || [];
        state.submittedTotal = pageData.totalElements || 0;
        state.submittedPage = action.payload.page;
      })
      .addCase(fetchSubmittedDocumentClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchPendingDocumentClients ----------
      .addCase(fetchPendingDocumentClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingDocumentClients.fulfilled, (state, action: PayloadAction<{ data: any; page: number }>) => {
        state.loading = false;
        const pageData = action.payload.data;
        state.pendingClients = pageData.content || [];
        state.pendingTotal = pageData.totalElements || 0;
        state.pendingPage = action.payload.page;
      })
      .addCase(fetchPendingDocumentClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchAdminDocumentById ----------
      .addCase(fetchAdminDocumentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDocumentById.fulfilled, (state, action: PayloadAction<AdminDocumentResponseDto>) => {
        state.loading = false;
        state.currentDocument = action.payload;
      })
      .addCase(fetchAdminDocumentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================================
      // ✅ NEW: CallHippo reducers (5 APIs)
      // ============================================================

      // 1. Client Call History
      .addCase(fetchCallHippoClientHistory.pending, (state) => {
        state.isCallHippoLoading = true;
        state.error = null;
      })
      .addCase(fetchCallHippoClientHistory.fulfilled, (state, action: PayloadAction<{ data: any; page: number; append: boolean }>) => {
        state.isCallHippoLoading = false;
        const pageData = action.payload.data;
        const content: CallHippoClientHistoryItem[] = pageData.content || [];
        const totalElements = pageData.totalElements || 0;
        const pageNumber = pageData.number ?? action.payload.page;
        const size = pageData.size || 20;

        state.clientCallHistoryPage = pageNumber;
        state.clientCallHistoryTotal = totalElements;
        state.clientCallHistoryHasMore = (pageNumber + 1) * size < totalElements;

        if (action.payload.append) {
          const existingIds = new Set(state.clientCallHistory.map((c) => c.id));
          const newUnique = content.filter((c) => !existingIds.has(c.id));
          state.clientCallHistory = [...state.clientCallHistory, ...newUnique];
        } else {
          state.clientCallHistory = content;
        }
      })
      .addCase(fetchCallHippoClientHistory.rejected, (state, action) => {
        state.isCallHippoLoading = false;
        state.error = action.payload as string;
        state.clientCallHistoryHasMore = false;
      })

      // 2. Embedded config
      .addCase(fetchCallHippoEmbeddedConfig.pending, (state) => {
        state.isCallHippoLoading = true;
        state.error = null;
      })
      .addCase(fetchCallHippoEmbeddedConfig.fulfilled, (state, action: PayloadAction<CallHippoEmbeddedConfig>) => {
        state.isCallHippoLoading = false;
        state.embeddedConfig = action.payload;
      })
      .addCase(fetchCallHippoEmbeddedConfig.rejected, (state, action) => {
        state.isCallHippoLoading = false;
        state.error = action.payload as string;
      })

      // 3. Admin Call Report
      .addCase(fetchAdminCallReportCalls.pending, (state) => {
        state.isCallHippoLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminCallReportCalls.fulfilled, (state, action: PayloadAction<{ data: any; page: number; append: boolean }>) => {
        state.isCallHippoLoading = false;
        const pageData = action.payload.data;
        const content: AdminCallReportCallDetail[] = pageData.content || [];
        const totalElements = pageData.totalElements || 0;
        const pageNumber = pageData.number ?? action.payload.page;
        const size = pageData.size || 20;

        state.adminCallReportPage = pageNumber;
        state.adminCallReportTotal = totalElements;
        state.adminCallReportHasMore = (pageNumber + 1) * size < totalElements;

        if (action.payload.append) {
          const existingIds = new Set(state.adminCallReport.map((c) => c.callHistoryId));
          const newUnique = content.filter((c) => !existingIds.has(c.callHistoryId));
          state.adminCallReport = [...state.adminCallReport, ...newUnique];
        } else {
          state.adminCallReport = content;
        }
      })
      .addCase(fetchAdminCallReportCalls.rejected, (state, action) => {
        state.isCallHippoLoading = false;
        state.error = action.payload as string;
        state.adminCallReportHasMore = false;
      })

      // 4. Activity Feed
      .addCase(fetchCallHippoActivityFeed.pending, (state) => {
        state.isCallHippoLoading = true;
        state.error = null;
      })
      .addCase(fetchCallHippoActivityFeed.fulfilled, (state, action: PayloadAction<CallHippoActivityFeedResponse>) => {
        state.isCallHippoLoading = false;
        state.activityFeed = action.payload;
      })
      .addCase(fetchCallHippoActivityFeed.rejected, (state, action) => {
        state.isCallHippoLoading = false;
        state.error = action.payload as string;
      })

      // 5. WhatsApp Link
      .addCase(fetchWhatsAppLink.pending, (state) => {
        state.isCallHippoLoading = true;
        state.error = null;
      })
      .addCase(fetchWhatsAppLink.fulfilled, (state, action: PayloadAction<WhatsAppLinkResponse>) => {
        state.isCallHippoLoading = false;
        state.whatsAppLink = action.payload.url;
      })
      .addCase(fetchWhatsAppLink.rejected, (state, action) => {
        state.isCallHippoLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearAdminDocuments,
  clearError,
  clearVerifiedClients,
  clearSubmittedClients,
  clearPendingClients,
  clearDocumentSummary,
  clearCurrentDocument,
  // ✅ NEW
  clearClientCallHistory,
  clearAdminCallReport,
  clearActivityFeed,
  clearWhatsAppLink,
} = adminDocumentsSlice.actions;

export default adminDocumentsSlice.reducer;