// src/store/slices/departmentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Department {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

// ============================================================
// NEW: Status filter state (with infinite scroll support)
// ============================================================
interface DepartmentsState {
  list: Department[];
  currentDepartment: Department | null;
  // ✅ Status filter state
  statusFilteredDepartments: Department[];
  statusTotal: number;
  statusPage: number;
  statusSize: number;
  statusHasMore: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentsState = {
  list: [],
  currentDepartment: null,
  statusFilteredDepartments: [],
  statusTotal: 0,
  statusPage: 0,
  statusSize: 20,
  statusHasMore: true,
  loading: false,
  error: null,
};

// ============================================================
// EXISTING THUNKS
// ============================================================

export const fetchDepartments = createAsyncThunk(
  'departments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/departments');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

export const fetchDepartmentById = createAsyncThunk(
  'departments/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/departments/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch department');
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async (deptData: { name: string; description?: string | null }, { rejectWithValue }) => {
    try {
      const response = await api.post('/departments', deptData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create department');
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ id, data }: { id: number; data: { name: string; description?: string | null } }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/departments/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update department');
    }
  }
);

export const deactivateDepartment = createAsyncThunk(
  'departments/deactivate',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/departments/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate department');
    }
  }
);

export const activateDepartment = createAsyncThunk(
  'departments/activate',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.patch(`/departments/${id}/activate`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate department');
    }
  }
);

// ============================================================
// ✅ NEW: FETCH DEPARTMENTS BY STATUS (PAGINATED)
// ============================================================
export const fetchDepartmentsByStatus = createAsyncThunk(
  'departments/fetchByStatus',
  async ({ active, page = 0, size = 20, append = false }: 
    { active: boolean; page?: number; size?: number; append?: boolean }, 
    { rejectWithValue }) => {
    try {
      const response = await api.get('/departments/status', { params: { active, page, size } });
      return { active, data: response.data, append };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments by status');
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    clearDepartments: (state) => {
      state.list = [];
      state.currentDepartment = null;
      state.statusFilteredDepartments = [];
      state.statusTotal = 0;
      state.statusPage = 0;
      state.statusSize = 20;
      state.statusHasMore = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // ✅ New reducers for status filter
    clearStatusFilteredDepartments: (state) => {
      state.statusFilteredDepartments = [];
      state.statusTotal = 0;
      state.statusPage = 0;
      state.statusSize = 20;
      state.statusHasMore = true;
    },
    resetStatusPagination: (state) => {
      state.statusFilteredDepartments = [];
      state.statusPage = 0;
      state.statusHasMore = true;
      state.statusTotal = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- EXISTING REDUCERS ----------
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action: PayloadAction<Department[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchDepartmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentById.fulfilled, (state, action: PayloadAction<Department>) => {
        state.loading = false;
        state.currentDepartment = action.payload;
      })
      .addCase(fetchDepartmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action: PayloadAction<Department>) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action: PayloadAction<Department>) => {
        state.loading = false;
        const index = state.list.findIndex(dept => dept.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.currentDepartment?.id === action.payload.id) {
          state.currentDepartment = action.payload;
        }
        // Also update in statusFilteredDepartments
        const statusIdx = state.statusFilteredDepartments.findIndex(d => d.id === action.payload.id);
        if (statusIdx !== -1) state.statusFilteredDepartments[statusIdx] = action.payload;
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deactivateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateDepartment.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const id = action.payload;
        const dept = state.list.find(d => d.id === id);
        if (dept) dept.active = false;
        if (state.currentDepartment?.id === id) state.currentDepartment.active = false;
        const statusDept = state.statusFilteredDepartments.find(d => d.id === id);
        if (statusDept) statusDept.active = false;
      })
      .addCase(deactivateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(activateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateDepartment.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const id = action.payload;
        const dept = state.list.find(d => d.id === id);
        if (dept) dept.active = true;
        if (state.currentDepartment?.id === id) state.currentDepartment.active = true;
        const statusDept = state.statusFilteredDepartments.find(d => d.id === id);
        if (statusDept) statusDept.active = true;
      })
      .addCase(activateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- ✅ NEW: fetchDepartmentsByStatus ----------
      .addCase(fetchDepartmentsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentsByStatus.fulfilled, (state, action: PayloadAction<{ active: boolean; data: any; append: boolean }>) => {
        state.loading = false;
        const pageData = action.payload.data;
        const content = pageData.content || [];
        const totalElements = pageData.totalElements || 0;
        const pageNumber = pageData.number || 0;
        const size = pageData.size || 20;

        state.statusPage = pageNumber;
        state.statusSize = size;
        state.statusTotal = totalElements;
        state.statusHasMore = (pageNumber + 1) * size < totalElements;

        if (action.payload.append) {
          state.statusFilteredDepartments = [...state.statusFilteredDepartments, ...content];
        } else {
          state.statusFilteredDepartments = content;
        }
      })
      .addCase(fetchDepartmentsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.statusHasMore = false;
      });
  },
});

export const { clearDepartments, clearError, clearStatusFilteredDepartments, resetStatusPagination } = departmentsSlice.actions;
export default departmentsSlice.reducer;