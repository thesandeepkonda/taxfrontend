// src/store/slices/departmentsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEPARTMENT_OPTIONS } from '../../constants/enums';

export interface Department {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

const STATIC_DEPARTMENTS: Department[] = DEPARTMENT_OPTIONS.map((d, idx) => ({
  id: idx + 1,
  name: d.value,
  description: null,
  active: true,
}));

interface DepartmentsState {
  list: Department[];
  currentDepartment: Department | null;
  statusFilteredDepartments: Department[];
  statusTotal: number;
  statusPage: number;
  statusSize: number;
  statusHasMore: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentsState = {
  list: STATIC_DEPARTMENTS,
  currentDepartment: null,
  statusFilteredDepartments: STATIC_DEPARTMENTS,
  statusTotal: STATIC_DEPARTMENTS.length,
  statusPage: 0,
  statusSize: 20,
  statusHasMore: false,
  loading: false,
  error: null,
};

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    fetchDepartments: (state) => {
      state.list = STATIC_DEPARTMENTS;
      state.loading = false;
      state.error = null;
    },
    fetchDepartmentsByStatus: (
      state,
      action: PayloadAction<{ active: boolean; page?: number; size?: number; append?: boolean }>
    ) => {
      state.statusFilteredDepartments = STATIC_DEPARTMENTS.filter(
        (d) => d.active === action.payload.active
      );
      state.statusTotal = state.statusFilteredDepartments.length;
      state.statusHasMore = false;
      state.loading = false;
      state.error = null;
    },
    fetchDepartmentById: (state, action: PayloadAction<number>) => {
      state.currentDepartment =
        STATIC_DEPARTMENTS.find((d) => d.id === action.payload) || null;
      state.loading = false;
    },
    clearDepartments: (state) => {
      state.currentDepartment = null;
      state.error = null;
    },
    clearError: (state) => { state.error = null; },
    clearStatusFilteredDepartments: (state) => {
      state.statusFilteredDepartments = STATIC_DEPARTMENTS;
      state.statusTotal = STATIC_DEPARTMENTS.length;
    },
    resetStatusPagination: (state) => {
      state.statusPage = 0;
      state.statusHasMore = false;
    },
  },
});

export const {
  fetchDepartments,
  fetchDepartmentsByStatus,
  fetchDepartmentById,
  clearDepartments,
  clearError,
  clearStatusFilteredDepartments,
  resetStatusPagination,
} = departmentsSlice.actions;

export default departmentsSlice.reducer;