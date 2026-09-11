// src/store/slices/rolesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Role {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

export interface Permission {
  id: number;
  code: string;
  active: boolean;
}

interface RolesState {
  list: Role[];
  currentRole: Role | null;
  currentPermissions: Permission[]; // ✅ NEW: permissions for the current role
  loading: boolean;
  error: string | null;
}

const initialState: RolesState = {
  list: [],
  currentRole: null,
  currentPermissions: [], // ✅ NEW
  loading: false,
  error: null,
};

// GET /roles
export const fetchRoles = createAsyncThunk(
  'roles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles');
    }
  }
);

// POST /roles
export const createRole = createAsyncThunk(
  'roles/create',
  async (roleData: { name: string; description?: string | null }, { rejectWithValue }) => {
    try {
      const response = await api.post('/roles', roleData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create role');
    }
  }
);

// GET /roles/{id}
export const fetchRoleById = createAsyncThunk(
  'roles/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/roles/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch role');
    }
  }
);

// ✅ NEW: GET /roles/{id}/permissions – fetch permissions for a role
export const fetchRolePermissions = createAsyncThunk(
  'roles/fetchPermissions',
  async (roleId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/roles/${roleId}/permissions`);
      return { roleId, permissions: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch role permissions');
    }
  }
);

// ✅ NEW: PUT /roles/{roleId}/permissions – assign permissions to a role
export const assignPermissions = createAsyncThunk(
  'roles/assignPermissions',
  async ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }, { rejectWithValue }) => {
    try {
      await api.put(`/roles/${roleId}/permissions`, { permissionIds });
      return { roleId, permissionIds };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign permissions');
    }
  }
);

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearRoles: (state) => {
      state.list = [];
      state.currentRole = null;
      state.currentPermissions = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- fetchRoles ----------
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action: PayloadAction<Role[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- createRole ----------
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action: PayloadAction<Role>) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- fetchRoleById ----------
      .addCase(fetchRoleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action: PayloadAction<Role>) => {
        state.loading = false;
        state.currentRole = action.payload;
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- ✅ fetchRolePermissions ----------
      .addCase(fetchRolePermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRolePermissions.fulfilled, (state, action: PayloadAction<{ roleId: number; permissions: Permission[] }>) => {
        state.loading = false;
        state.currentPermissions = action.payload.permissions;
      })
      .addCase(fetchRolePermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- ✅ assignPermissions ----------
      .addCase(assignPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignPermissions.fulfilled, (state, action: PayloadAction<{ roleId: number; permissionIds: number[] }>) => {
        state.loading = false;
        // Update currentPermissions to reflect assigned IDs (optional, but you can re-fetch)
        // Or simply mark success; you'll likely re-fetch permissions after assignment.
        // You can also keep currentPermissions as-is; the UI will reflect via re-fetch.
      })
      .addCase(assignPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearRoles, clearError } = rolesSlice.actions;
export default rolesSlice.reducer;