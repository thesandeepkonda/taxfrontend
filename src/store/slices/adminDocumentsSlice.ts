// src/store/slices/adminDocumentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { DocumentRequestResponse, DocumentResponse } from './documentSlice'; // Reuse types

// ---------- State ----------
interface AdminDocumentsState {
  requests: DocumentRequestResponse[];
  loading: boolean;
  error: string | null;
  // For viewing document in modal
  viewingDocument: DocumentResponse | null;
}

const initialState: AdminDocumentsState = {
  requests: [],
  loading: false,
  error: null,
  viewingDocument: null,
};

// ---------- Async Thunks ----------

// 1. Fetch ALL document requests (Admin only)
// ✅ Backend lo ee API add cheyali: GET /api/admin/documents/requests
export const fetchAllDocumentRequests = createAsyncThunk(
  'adminDocuments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/documents/requests');
      return response.data; // List<DocumentRequestResponseDto>
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch document requests');
    }
  }
);

// 2. Verify a document (Admin marks as verified)
// ✅ Backend lo ee API add cheyali: PATCH /api/admin/documents/{documentId}/verify
export const verifyDocument = createAsyncThunk(
  'adminDocuments/verify',
  async ({ documentId, remarks }: { documentId: number; remarks?: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/documents/${documentId}/verify`, { remarks });
      return response.data; // Updated DocumentResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify document');
    }
  }
);

// 3. View/Download document (Uses existing backend API)
// This is not a thunk that modifies state; it just opens the file.
export const viewDocument = async (documentId: number) => {
  try {
    // Backend returns the file directly (blob)
    const response = await api.get(`/documents/admin/view/${documentId}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    window.open(url, '_blank'); // Opens in new tab (PDF/Image)
    return true;
  } catch (error: any) {
    console.error('View document error:', error);
    throw new Error(error.response?.data?.message || 'Failed to view document');
  }
};

// ---------- Slice ----------
const adminDocumentsSlice = createSlice({
  name: 'adminDocuments',
  initialState,
  reducers: {
    clearAdminDocuments(state) {
      state.requests = [];
      state.error = null;
      state.viewingDocument = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
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
      // Verify Document
      .addCase(verifyDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyDocument.fulfilled, (state, action: PayloadAction<DocumentResponse>) => {
        state.loading = false;
        // Update the specific document in the list
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
      });
  },
});

export const { clearAdminDocuments, clearError } = adminDocumentsSlice.actions;
export default adminDocumentsSlice.reducer;