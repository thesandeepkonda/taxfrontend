// src/store/slices/permissionSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface PermissionResponse {
  id: number;
  code: string;
  active: boolean;
}

export interface CreatePermissionRequest {
  code: string;
}

interface PermissionState {
  list: PermissionResponse[];
  currentPermission: PermissionResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: PermissionState = {
  list: [],
  currentPermission: null,
  loading: false,
  error: null,
};

// Fetch all permissions
export const fetchPermissions = createAsyncThunk(
  'permissions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/permissions');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

// Create permission
export const createPermission = createAsyncThunk(
  'permissions/create',
  async (data: CreatePermissionRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/permissions', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create permission');
    }
  }
);

// Get permission by ID
export const fetchPermissionById = createAsyncThunk(
  'permissions/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/permissions/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permission');
    }
  }
);

const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearPermissions(state) {
      state.list = [];
      state.currentPermission = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action: PayloadAction<PermissionResponse[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPermission.fulfilled, (state, action: PayloadAction<PermissionResponse>) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPermissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissionById.fulfilled, (state, action: PayloadAction<PermissionResponse>) => {
        state.loading = false;
        state.currentPermission = action.payload;
      })
      .addCase(fetchPermissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPermissions, clearError } = permissionSlice.actions;
export default permissionSlice.reducer;