// src/store/slices/bulkEmployeeSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface BulkEmployeeError {
  rowNumber: number;
  field: string;
  value: string;
  message: string;
}

export interface BulkEmployeeResponse {
  success: boolean;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: BulkEmployeeError[];
}

interface BulkEmployeeState {
  response: BulkEmployeeResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: BulkEmployeeState = {
  response: null,
  loading: false,
  error: null,
};

export const uploadBulkEmployees = createAsyncThunk(
  'bulkEmployee/upload',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/employees/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Bulk upload failed');
    }
  }
);

const bulkEmployeeSlice = createSlice({
  name: 'bulkEmployee',
  initialState,
  reducers: {
    clearBulkResponse(state) {
      state.response = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadBulkEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadBulkEmployees.fulfilled, (state, action: PayloadAction<BulkEmployeeResponse>) => {
        state.loading = false;
        state.response = action.payload;
      })
      .addCase(uploadBulkEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearBulkResponse, clearError } = bulkEmployeeSlice.actions;
export default bulkEmployeeSlice.reducer;