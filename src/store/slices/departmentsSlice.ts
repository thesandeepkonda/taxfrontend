// src/store/slices/departmentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Department {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

interface DepartmentsState {
  list: Department[];
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentsState = {
  list: [],
  loading: false,
  error: null,
};

// ✅ Async Thunk: Fetch all departments
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

// ✅ Async Thunk: Create a new department
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

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    clearDepartments: (state) => {
      state.list = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { clearDepartments, clearError } = departmentsSlice.actions;
export default departmentsSlice.reducer;