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
  callSid?: string | null;
}

export interface CallHippoConfig {
  token: string;
  email: string;
  agentId: string;
}

export interface SearchDocClientsPayload {
  query?: string;
  period?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface FetchCallHistoryParams {
  page?: number;
  size?: number;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  append?: boolean;
}

export interface TeamLeadEmployeeCallReport {
  userId: number;
  employeeCode: string;
  employeeName: string;
  totalClients: number;
  totalCalls: number;
  answeredCalls: number;
  notAnsweredCalls: number;
  failedCalls: number;
  totalTalkTimeSeconds: number;
  totalTalkTimeMinutes: number;
  averageTalkTimeSeconds: number;
  firstCallTime: string | null;
  lastCallTime: string | null;
}

export interface TeamLeadClientCallReport {
  clientId: number;
  clientName: string;
  phone: string;
  totalCalls: number;
  answeredCalls: number;
  notAnsweredCalls: number;
  failedCalls: number;
  totalTalkTimeSeconds: number;
  totalTalkTimeMinutes: number;
  firstCallTime: string | null;
  lastCallTime: string | null;
}

export interface TeamLeadCallDetail {
  callHistoryId: number;
  clientId: number;
  clientName: string;
  employeeCode: string;
  employeeName: string;
  userId: number;
  agentId: string | null;
  callSid: string | null;
  fromNumber: string | null;
  toNumber: string | null;
  callType: string | null;
  status: string | null;
  duration: number | null;
  durationSeconds: number | null;
  billedMinutes: number | null;
  callCharge: number | null;
  recordingUrl: string | null;
  hangupBy: string | null;
  answeredDevice: string | null;
  countryName: string | null;
  callTime: string | null;
  startTime: string | null;
  endTime: string | null;
}

interface DocClientsState {
  list: DocClient[];
  callHistory: any[]; 
  callHistoryPage: number;
  callHistoryHasMore: boolean;
  activeCall: CallResponse | null;
  myRequests: DocumentRequestResponse[];
  publicRequest: DocumentRequestResponse | null;
  comments: CommentResponse[];
  searchResults: DocClient[];
  searchTotal: number;
  isSearching: boolean;
  searchActive: boolean;
  clientCallHistory: CallHippoRecord[];
  clientCallHistoryPage: number;
  clientCallHistoryHasMore: boolean;
  isClientCallHistoryLoading: boolean;
  isCallHippoAvailable: boolean;
  isCallHippoStatusLoading: boolean;
  callHippoConfig: CallHippoConfig | null;
  isCallHippoConfigLoading: boolean;
  teamCallReport: TeamLeadEmployeeCallReport[];
  employeeClientsReport: TeamLeadClientCallReport[];
  clientCallDetails: TeamLeadCallDetail[];
  isTeamReportLoading: boolean;
  isEmployeeClientsLoading: boolean;
  isClientCallDetailsLoading: boolean;
  isSettingReminder: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: DocClientsState = {
  list: [],
  callHistory: [],
  callHistoryPage: 0,
  callHistoryHasMore: true,
  activeCall: null,
  myRequests: [],
  publicRequest: null,
  comments: [],
  searchResults: [],
  searchTotal: 0,
  isSearching: false,
  searchActive: false,
  clientCallHistory: [],
  clientCallHistoryPage: 0,
  clientCallHistoryHasMore: true,
  isClientCallHistoryLoading: false,
  isCallHippoAvailable: false,
  isCallHippoStatusLoading: false,
  callHippoConfig: null,
  isCallHippoConfigLoading: false,
  teamCallReport: [],
  employeeClientsReport: [],
  clientCallDetails: [],
  isTeamReportLoading: false,
  isEmployeeClientsLoading: false,
  isClientCallDetailsLoading: false,
  isSettingReminder: false,
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

// FIX: Updated to support pagination parameters natively
export const fetchClientsByStatuses = createAsyncThunk(
  'docClients/fetchByStatuses',
  async (payload: { statuses: string[]; page?: number; size?: number; append?: boolean } | string[], { rejectWithValue }) => {
    try {
      let statuses: string[];
      let page = 0;
      let size = 20;
      let append = false;

      if (Array.isArray(payload)) {
        statuses = payload;
      } else {
        statuses = payload.statuses;
        page = payload.page || 0;
        size = payload.size || 20;
        append = payload.append || false;
      }

      const requests = statuses.map(status => apiDev2.get(`/doc/clients/status/${status}`, { params: { page, size } }));
      const responses = await Promise.all(requests);
      
      let combinedData: DocClient[] = [];
      responses.forEach(response => {
        const content = Array.isArray(response.data) ? response.data : (response.data?.content || []);
        combinedData = combinedData.concat(content);
      });
      return { data: combinedData, append };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients by status');
    }
  }
);

// FIX: Updated to support pagination parameters natively
export const fetchDocClients = createAsyncThunk(
  'docClients/fetchAll',
  async (params: { page?: number; size?: number; append?: boolean } | void, { rejectWithValue }) => {
    try {
      const queryParams = params ? { page: params.page || 0, size: params.size || 20 } : { page: 0, size: 20 };
      const response = await apiDev2.get('/doc/clients', { params: queryParams });
      return { data: response.data, append: params?.append || false };
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
  async (params: FetchCallHistoryParams | void, { rejectWithValue }) => {
    try {
      const queryParams: Record<string, any> = {
        page: params?.page || 0,
        size: params?.size || 20
      };
      if (params?.clientId) queryParams.clientId = params.clientId;
      if (params?.startDate) queryParams.startDate = params.startDate;
      if (params?.endDate) queryParams.endDate = params.endDate;

      const response = await apiDev2.get('/callhippo/employee/calls', { params: queryParams });
      return { data: response.data, append: params?.append };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch call history');
    }
  }
);

export const fetchClientCallHippoHistory = createAsyncThunk(
  'docClients/fetchClientCallHippoHistory',
  async ({ clientId, page = 0, size = 20, append = false }: { clientId: number; page?: number; size?: number; append?: boolean }, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get(`/callhippo/client/${clientId}/history`, { params: { page, size } });
      return { data: response.data, append };
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

export const fetchCallHippoConfig = createAsyncThunk(
  'docClients/fetchCallHippoConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev2.get('/callhippo/embedded/config');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch CallHippo config');
    }
  }
);

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

export const createCallReminder = createAsyncThunk(
  'docClients/createCallReminder',
  async ({ clientId, reminderTime }: { clientId: number; reminderTime: number }, { rejectWithValue }) => {
    try {
      const response = await apiDev2.post('/callhippo/reminder', { clientId, reminderTime });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set call reminder');
    }
  }
);

export const fetchAuthorizedRecording = createAsyncThunk(
  'docClients/fetchAuthorizedRecording',
  async ({ callSid, callTime }: { callSid: string; callTime?: string }, { rejectWithValue }) => {
    try {
      let startDate = "2026/01/01";
      let endDate = "2026/12/31"; 
      if (callTime) {
        const dateObj = new Date(callTime);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        startDate = `${y}/${m}/${d}`;
        endDate = `${y}/${m}/${d}`;
      }

      const payload = {
        skip: "0",
        limit: "20",
        startDate,
        endDate,
        crmUniqueId: "",
        callSid
      };

      const response = await apiDev2.post('/callhippo/activityfeed', payload);
      
      if (response.data?.success && response.data?.data?.callLogs?.recordingUrl) {
        return response.data.data.callLogs.recordingUrl;
      }
      return rejectWithValue('Recording URL not found in the response.');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recording');
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

export const fetchTeamCallReport = createAsyncThunk(
  'docClients/fetchTeamCallReport',
  async (params: { startDate?: string; endDate?: string } | void, { rejectWithValue }) => {
    try {
      const queryParams: Record<string, any> = {};
      if (params?.startDate) queryParams.startDate = params.startDate;
      if (params?.endDate) queryParams.endDate = params.endDate;
      const response = await apiDev2.get('/callhippo/team-lead/call-report/employees', { params: queryParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team call report');
    }
  }
);

export const fetchEmployeeClientsReport = createAsyncThunk(
  'docClients/fetchEmployeeClientsReport',
  async (params: { employeeId: number; startDate?: string; endDate?: string; page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const { employeeId, ...restParams } = params;
      const queryParams: Record<string, any> = { page: restParams.page || 0, size: restParams.size || 20 };
      if (restParams.startDate) queryParams.startDate = restParams.startDate;
      if (restParams.endDate) queryParams.endDate = restParams.endDate;
      
      const response = await apiDev2.get(`/callhippo/team-lead/call-report/employees/${employeeId}/clients`, { params: queryParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employee clients report');
    }
  }
);

export const fetchClientCallDetails = createAsyncThunk(
  'docClients/fetchClientCallDetails',
  async (params: { employeeId: number; clientId: number; startDate?: string; endDate?: string; page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const { employeeId, clientId, ...restParams } = params;
      const queryParams: Record<string, any> = { page: restParams.page || 0, size: restParams.size || 20 };
      if (restParams.startDate) queryParams.startDate = restParams.startDate;
      if (restParams.endDate) queryParams.endDate = restParams.endDate;
      const response = await apiDev2.get(`/callhippo/team-lead/call-report/employees/${employeeId}/clients/${clientId}/calls`, { params: queryParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client call details');
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
    },
    clearTeamReports: (state) => {
      state.teamCallReport = [];
      state.employeeClientsReport = [];
      state.clientCallDetails = [];
    },
    clearClientCallHistory: (state) => {
      state.clientCallHistory = [];
      state.clientCallHistoryPage = 0;
      state.clientCallHistoryHasMore = true;
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
      
      // FIX: Proper Append logic for fetchClientsByStatuses
      .addCase(fetchClientsByStatuses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClientsByStatuses.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const content = action.payload.data || action.payload || [];
        if (action.payload.append) {
          const existingIds = new Set(state.list.map(c => c.clientId));
          const uniqueNew = content.filter((c: any) => !existingIds.has(c.clientId));
          state.list = [...state.list, ...uniqueNew];
        } else {
          state.list = content;
        }
      })
      .addCase(fetchClientsByStatuses.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      
      // FIX: Proper Append logic for fetchDocClients
      .addCase(fetchDocClients.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDocClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const pageData = action.payload.data || action.payload;
        const content = Array.isArray(pageData) ? pageData : (pageData?.content || []);
        if (action.payload.append) {
          const existingIds = new Set(state.list.map(c => c.clientId));
          const uniqueNew = content.filter((c: any) => !existingIds.has(c.clientId));
          state.list = [...state.list, ...uniqueNew];
        } else {
          state.list = content;
        }
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
        const pageData = action.payload.data;
        const content = pageData?.content || (Array.isArray(pageData) ? pageData : []);
        const totalElements = pageData?.totalElements || 0;
        const pageNumber = pageData?.number || 0;
        const size = pageData?.size || 20;
        state.callHistoryPage = pageNumber;
        state.callHistoryHasMore = pageData?.content ? (pageNumber + 1) * size < totalElements : false;
        if (action.payload.append) {
          state.callHistory = [...state.callHistory, ...content];
        } else {
          state.callHistory = content;
        }
      })
      .addCase(fetchCallHistory.rejected, (state, action) => { 
         state.loading = false; 
         state.error = action.payload as string; 
         state.callHistoryHasMore = false;
      })
      
      .addCase(fetchClientCallHippoHistory.pending, (state) => {
        state.isClientCallHistoryLoading = true;
      })
      .addCase(fetchClientCallHippoHistory.fulfilled, (state, action: PayloadAction<any>) => {
        state.isClientCallHistoryLoading = false;
        const pageData = action.payload.data;
        const content = pageData?.content || [];
        const totalElements = pageData?.totalElements || 0;
        const pageNumber = pageData?.number || 0;
        const size = pageData?.size || 20;
        state.clientCallHistoryPage = pageNumber;
        state.clientCallHistoryHasMore = (pageNumber + 1) * size < totalElements;
        if (action.payload.append) {
          state.clientCallHistory = [...state.clientCallHistory, ...content];
        } else {
          state.clientCallHistory = content;
        }
      })
      .addCase(fetchClientCallHippoHistory.rejected, (state, action) => {
        state.isClientCallHistoryLoading = false;
        state.error = action.payload as string;
        state.clientCallHistoryHasMore = false;
      })
      
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
      .addCase(fetchCallHippoConfig.pending, (state) => {
        state.isCallHippoConfigLoading = true;
        state.error = null;
      })
      .addCase(fetchCallHippoConfig.fulfilled, (state, action: PayloadAction<CallHippoConfig>) => {
        state.isCallHippoConfigLoading = false;
        state.callHippoConfig = action.payload;
      })
      .addCase(fetchCallHippoConfig.rejected, (state, action) => {
        state.isCallHippoConfigLoading = false;
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
      
      .addCase(createCallReminder.pending, (state) => {
        state.isSettingReminder = true;
        state.error = null;
      })
      .addCase(createCallReminder.fulfilled, (state) => {
        state.isSettingReminder = false;
      })
      .addCase(createCallReminder.rejected, (state, action) => {
        state.isSettingReminder = false;
        state.error = action.payload as string;
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
      })
      
      .addCase(fetchTeamCallReport.pending, (state) => {
        state.isTeamReportLoading = true;
        state.error = null;
      })
      .addCase(fetchTeamCallReport.fulfilled, (state, action: PayloadAction<TeamLeadEmployeeCallReport[]>) => {
        state.isTeamReportLoading = false;
        state.teamCallReport = action.payload;
      })
      .addCase(fetchTeamCallReport.rejected, (state, action) => {
        state.isTeamReportLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEmployeeClientsReport.pending, (state) => {
        state.isEmployeeClientsLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeClientsReport.fulfilled, (state, action: PayloadAction<any>) => {
        state.isEmployeeClientsLoading = false;
        state.employeeClientsReport = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
      })
      .addCase(fetchEmployeeClientsReport.rejected, (state, action) => {
        state.isEmployeeClientsLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchClientCallDetails.pending, (state) => {
        state.isClientCallDetailsLoading = true;
        state.error = null;
      })
      .addCase(fetchClientCallDetails.fulfilled, (state, action: PayloadAction<any>) => {
        state.isClientCallDetailsLoading = false;
        state.clientCallDetails = Array.isArray(action.payload) ? action.payload : (action.payload?.content || []);
      })
      .addCase(fetchClientCallDetails.rejected, (state, action) => {
        state.isClientCallDetailsLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDocClientsError, clearDocClientsSearch, clearTeamReports, clearClientCallHistory } = docClientsSlice.actions;
export default docClientsSlice.reducer;