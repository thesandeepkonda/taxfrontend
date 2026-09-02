// src/store/slices/usersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { apiDev1 } from '../../services/api'; // <-- Import apiDev1

// ✅ Updated User interface to match CreateEmployeeResponse from backend
export interface User {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string | null; // Backend allows null
  email: string;
  phone: string;
  departmentId: number | null;
  departmentName: string | null; // ✅ New
  teamId: number | null;
  teamName: string | null; // ✅ New
  roleId: number | null;
  roleName: string | null; // ✅ New (previously optional)
  temporaryPassword: string | null; // ✅ New (only on create)
  active: boolean;
  attendancePolicyId: number | null; // ✅ New
  attendancePolicyName: string | null; // ✅ New
  workMode: 'OFFICE' | 'WORK_FROM_HOME' | 'HYBRID'; // ✅ New
}

interface UsersState {
  list: User[];
  currentUser: User | null;
  usersByTeam: Record<number, User[]>; // Cache users by team ID
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  currentUser: null,
  usersByTeam: {},
  loading: false,
  error: null,
};

// Fetch user details specifically for dashboard
export const fetchUserDetails = createAsyncThunk(
  'users/fetchDetails',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await apiDev1.get(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user details');
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

// Create employee (single role + department)
export const createEmployee = createAsyncThunk(
  'users/create',
  async (userData: {
    employeeCode: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    phone: string;
    departmentId: number;
    teamId: number;
    roleId: number;
    // Note: attendancePolicyId and workMode are NOT in create request currently
    // as per your OpenAPI spec, but if needed, they can be added here.
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
    }
  }
);

// Fetch users by team ID
export const fetchUsersByTeam = createAsyncThunk(
  'users/fetchByTeam',
  async (teamId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/teams/${teamId}/users`);
      return { teamId, users: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users for team');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsers: (state) => {
      state.list = [];
      state.currentUser = null;
      state.usersByTeam = {};
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch all users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create employee
      .addCase(createEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch users by team
      .addCase(fetchUsersByTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersByTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.usersByTeam[action.payload.teamId] = action.payload.users;
      })
      .addCase(fetchUsersByTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUsers, clearError } = usersSlice.actions;
export default usersSlice.reducer;