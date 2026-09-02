// src/store/slices/documentSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface DocumentResponse {
  documentId: number;
  documentType: string;
  documentName: string;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  uploaded: boolean;
  verified: boolean;
  remarks: string | null;
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

export interface CreateDocumentRequest {
  clientId: number;
  expiresAt?: string;
  documentTypes: string[];
}

interface DocumentState {
  myRequests: DocumentRequestResponse[];
  currentRequest: DocumentRequestResponse | null;
  publicRequest: DocumentRequestResponse | null; // for token view
  loading: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  myRequests: [],
  currentRequest: null,
  publicRequest: null,
  loading: false,
  error: null,
};

// Create document request (doc employee)
export const createDocumentRequest = createAsyncThunk(
  'document/createRequest',
  async (data: CreateDocumentRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/documents/request', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create document request');
    }
  }
);

// Get my requests (doc employee)
export const fetchMyDocumentRequests = createAsyncThunk(
  'document/fetchMyRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/documents/my-requests');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my requests');
    }
  }
);

// Get a single request by ID (doc employee)
export const fetchDocumentRequestById = createAsyncThunk(
  'document/fetchRequestById',
  async (requestId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/documents/my-requests/${requestId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch request');
    }
  }
);

// Get public request by token (client)
export const fetchPublicDocumentRequest = createAsyncThunk(
  'document/fetchPublic',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/documents/public/${token}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Invalid document link');
    }
  }
);

// Upload document (client)
export const uploadDocument = createAsyncThunk(
  'document/upload',
  async ({ token, documentId, file }: { token: string; documentId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/documents/public/${token}/upload/${documentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Upload failed');
    }
  }
);

// Submit documents (client)
export const submitDocuments = createAsyncThunk(
  'document/submit',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/documents/public/${token}/submit`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Submission failed');
    }
  }
);

// Admin view document (view file) – returns blob, so handle separately
// We'll just have a thunk to get the URL (or directly download)

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    clearDocuments(state) {
      state.myRequests = [];
      state.currentRequest = null;
      state.publicRequest = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDocumentRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDocumentRequest.fulfilled, (state, action: PayloadAction<DocumentRequestResponse>) => {
        state.loading = false;
        state.myRequests.unshift(action.payload);
      })
      .addCase(createDocumentRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMyDocumentRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyDocumentRequests.fulfilled, (state, action: PayloadAction<DocumentRequestResponse[]>) => {
        state.loading = false;
        state.myRequests = action.payload;
      })
      .addCase(fetchMyDocumentRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDocumentRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentRequestById.fulfilled, (state, action: PayloadAction<DocumentRequestResponse>) => {
        state.loading = false;
        state.currentRequest = action.payload;
      })
      .addCase(fetchDocumentRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPublicDocumentRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicDocumentRequest.fulfilled, (state, action: PayloadAction<DocumentRequestResponse>) => {
        state.loading = false;
        state.publicRequest = action.payload;
      })
      .addCase(fetchPublicDocumentRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action: PayloadAction<DocumentResponse>) => {
        state.loading = false;
        // Update the document in current request or public request
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
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(submitDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitDocuments.fulfilled, (state, action: PayloadAction<DocumentRequestResponse>) => {
        state.loading = false;
        state.publicRequest = action.payload;
        // Also update myRequests if exists
        const idx = state.myRequests.findIndex(r => r.requestId === action.payload.requestId);
        if (idx !== -1) state.myRequests[idx] = action.payload;
        if (state.currentRequest?.requestId === action.payload.requestId) state.currentRequest = action.payload;
      })
      .addCase(submitDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDocuments, clearError } = documentSlice.actions;
export default documentSlice.reducer;