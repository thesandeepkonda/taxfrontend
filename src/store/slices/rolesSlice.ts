// src/store/slices/rolesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ROLE_OPTIONS } from '../../constants/enums';

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

const STATIC_ROLES: Role[] = ROLE_OPTIONS.map((r, idx) => ({
  id: idx + 1,
  name: r.value,
  description: null,
  active: true,
}));

interface RolesState {
  list: Role[];
  currentRole: Role | null;
  currentPermissions: Permission[];
  loading: boolean;
  error: string | null;
}

const initialState: RolesState = {
  list: STATIC_ROLES,
  currentRole: null,
  currentPermissions: [],
  loading: false,
  error: null,
};

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    fetchRoles: (state) => {
      state.list = STATIC_ROLES;
      state.loading = false;
      state.error = null;
    },
    fetchRoleById: (state, action: PayloadAction<number>) => {
      state.currentRole = STATIC_ROLES.find((r) => r.id === action.payload) || null;
      state.loading = false;
    },
    clearRoles: (state) => {
      state.list = STATIC_ROLES;
      state.currentRole = null;
      state.currentPermissions = [];
      state.error = null;
    },
    clearError: (state) => { state.error = null; },
    fetchRolePermissions: (state) => { state.loading = false; },
    assignPermissions: (state) => { state.loading = false; },
  },
});

export const {
  fetchRoles,
  fetchRoleById,
  clearRoles,
  clearError,
  fetchRolePermissions,
  assignPermissions,
} = rolesSlice.actions;

export default rolesSlice.reducer;