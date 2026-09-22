// src/store/slices/usersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { apiDev1 } from '../../services/api';

export interface User {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string;
  department: string | null;          // enum: DOCUMENTATION etc.
  departmentName: string | null;
  teamId: number | null;
  teamName: string | null;
  roleId: number | null;
  roleName: string | null;            // enum: ADMIN | TEAM_LEAD | EMPLOYEE
  temporaryPassword: string | null;
  active: boolean;
  attendancePolicyId: number | null;
  attendancePolicyName: string | null;
  workMode: 'OFFICE' | 'WORK_FROM_HOME' | 'HYBRID';
  callHippoApiToken?: string | null;
  callHippoFromNumber?: string | null;
  callHippoAgentId?: string | null;
}

export interface CreateEmployeeRequest {
  employeeCode: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone: string;
  department: string;                 // ✅ enum
  teamId?: number | null;
  role?: string | null;               // ✅ enum string
  attendancePolicyId: number;
  workMode: 'OFFICE' | 'WORK_FROM_HOME' | 'HYBRID';
  callHippoApiToken?: string | null;
  callHippoFromNumber?: string | null;
  callHippoAgentId?: string | null;
}

export interface UpdateEmployeeRequest {
  firstName: string;
  lastName?: string | null;
  email: string;
  phone: string;
  department: string;                 // ✅ enum
  teamId?: number | null;
  role?: string | null;               // ✅ enum string
  active: boolean;
  attendancePolicyId: number;
  workMode: 'OFFICE' | 'WORK_FROM_HOME' | 'HYBRID';
  callHippoApiToken?: string | null;
  callHippoFromNumber?: string | null;
  callHippoAgentId?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ActivityLogResponseDto {
  id: number;
  performedBy: string;
  actionType: string;
  description: string;
  timestamp: string;
}

export interface QuickAssignRequestDto {
  teamId?: number | null;
  department?: string | null;         // ✅ enum string
  roleId?: number | null;
  override?: boolean;
}

export interface TeamLeadResponseDto {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  email: string;
  departmentName: string;
  teamId: number | null;
  teamName: string;
}

interface UsersState {
  list: User[];
  currentUser: User | null;
  usersByTeam: Record<number, User[]>;
  myTeamUsers: User[];
  history: ActivityLogResponseDto[];
  teamLeads: TeamLeadResponseDto[];
  statusFilteredUsers: User[];
  statusTotal: number;
  statusPage: number;
  statusSize: number;
  statusHasMore: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  currentUser: null,
  usersByTeam: {},
  myTeamUsers: [],
  history: [],
  teamLeads: [],
  statusFilteredUsers: [],
  statusTotal: 0,
  statusPage: 0,
  statusSize: 20,
  statusHasMore: true,
  loading: false,
  error: null,
};

// ============================================================
// THUNKS
// ============================================================
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

export const fetchUsersByStatus = createAsyncThunk(
  'users/fetchByStatus',
  async (
    { active, page = 0, size = 20, append = false }: {
      active: boolean; page?: number; size?: number; append?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/users/status', { params: { active, page, size } });
      return { active, data: response.data, append };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users by status');
    }
  }
);

export const createEmployee = createAsyncThunk(
  'users/create',
  async (userData: CreateEmployeeRequest, { rejectWithValue }) => {
    try {
      const payload: CreateEmployeeRequest = {
        employeeCode: userData.employeeCode.trim(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName?.trim() || null,
        email: userData.email.trim().toLowerCase(),
        phone: userData.phone.trim(),
        department: userData.department,
        teamId: userData.teamId != null ? Number(userData.teamId) : null,
        role: userData.role || null,
        attendancePolicyId: Number(userData.attendancePolicyId),
        workMode: userData.workMode,
      };
      if (userData.callHippoApiToken) payload.callHippoApiToken = userData.callHippoApiToken;
      if (userData.callHippoFromNumber) payload.callHippoFromNumber = userData.callHippoFromNumber;
      if (userData.callHippoAgentId) payload.callHippoAgentId = userData.callHippoAgentId;

      const response = await api.post('/users', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'users/update',
  async ({ id, ...updateData }: { id: number } & UpdateEmployeeRequest, { rejectWithValue }) => {
    try {
      const payload: UpdateEmployeeRequest = {
        firstName: updateData.firstName.trim(),
        lastName: updateData.lastName?.trim() || null,
        email: updateData.email.trim().toLowerCase(),
        phone: updateData.phone.trim(),
        department: updateData.department,
        teamId: updateData.teamId != null ? Number(updateData.teamId) : null,
        role: updateData.role || null,
        active: Boolean(updateData.active),
        attendancePolicyId: Number(updateData.attendancePolicyId),
        workMode: updateData.workMode,
      };
      if (updateData.callHippoApiToken) payload.callHippoApiToken = updateData.callHippoApiToken;
      if (updateData.callHippoFromNumber) payload.callHippoFromNumber = updateData.callHippoFromNumber;
      if (updateData.callHippoAgentId) payload.callHippoAgentId = updateData.callHippoAgentId;

      const response = await api.put(`/users/${id}`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update employee');
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateStatus',
  async ({ userId, active }: { userId: number; active: boolean }, { rejectWithValue }) => {
    try {
      await api.patch(`/users/${userId}/status`, null, { params: { active } });
      return { userId, active };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user status');
    }
  }
);

export const changePassword = createAsyncThunk(
  'users/changePassword',
  async (passwordData: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      await api.put('/users/change-password', passwordData);
      return;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

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

export const fetchMyTeamUsers = createAsyncThunk(
  'users/fetchMyTeam',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/teams/my-team/users');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team members');
    }
  }
);

export const fetchEmployeeHistory = createAsyncThunk(
  'users/fetchHistory',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}/history`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employee history');
    }
  }
);

export const quickAssign = createAsyncThunk(
  'users/quickAssign',
  async ({ userId, data }: { userId: number; data: QuickAssignRequestDto }, { rejectWithValue }) => {
    try {
      await api.patch(`/users/${userId}/quick-assign`, data);
      return { userId, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Quick assign failed');
    }
  }
);

export const fetchTeamLeads = createAsyncThunk(
  'users/fetchTeamLeads',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/team-leads');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team leads');
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsers: (state) => {
      state.list = [];
      state.currentUser = null;
      state.usersByTeam = {};
      state.myTeamUsers = [];
      state.history = [];
      state.teamLeads = [];
      state.statusFilteredUsers = [];
      state.statusTotal = 0;
      state.statusPage = 0;
      state.statusSize = 20;
      state.statusHasMore = true;
      state.error = null;
    },
    clearError: (state) => { state.error = null; },
    clearHistory: (state) => { state.history = []; },
    clearTeamLeads: (state) => { state.teamLeads = []; },
    clearStatusFilteredUsers: (state) => {
      state.statusFilteredUsers = [];
      state.statusTotal = 0;
      state.statusPage = 0;
      state.statusSize = 20;
      state.statusHasMore = true;
    },
    resetStatusPagination: (state) => {
      state.statusFilteredUsers = [];
      state.statusPage = 0;
      state.statusHasMore = true;
      state.statusTotal = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDetails.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUserDetails.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUsersByStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsersByStatus.fulfilled, (state, action: PayloadAction<{ active: boolean; data: any; append: boolean }>) => {
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
          state.statusFilteredUsers = [...state.statusFilteredUsers, ...content];
        } else {
          state.statusFilteredUsers = content;
        }
      })
      .addCase(fetchUsersByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.statusHasMore = false;
      })
      .addCase(createEmployee.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createEmployee.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.list.push(action.payload);
        if (action.payload.active) {
          state.statusFilteredUsers = [action.payload, ...state.statusFilteredUsers];
          state.statusTotal += 1;
        }
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateEmployee.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateEmployee.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        const updated = action.payload;
        const updateInArray = (users: User[]) => {
          const index = users.findIndex((u) => u.id === updated.id);
          if (index !== -1) users[index] = updated;
          return users;
        };
        state.list = updateInArray(state.list);
        if (state.currentUser?.id === updated.id) state.currentUser = updated;
        state.statusFilteredUsers = updateInArray(state.statusFilteredUsers);
        Object.keys(state.usersByTeam).forEach((teamId) => {
          const teamUsers = state.usersByTeam[Number(teamId)];
          const idx = teamUsers.findIndex((u) => u.id === updated.id);
          if (idx !== -1) teamUsers[idx] = updated;
        });
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUserStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateUserStatus.fulfilled, (state, action: PayloadAction<{ userId: number; active: boolean }>) => {
        state.loading = false;
        const { userId, active } = action.payload;
        const updateStatusInArray = (users: User[]) => {
          const user = users.find((u) => u.id === userId);
          if (user) user.active = active;
          return users;
        };
        state.list = updateStatusInArray(state.list);
        if (state.currentUser?.id === userId) state.currentUser.active = active;
        state.statusFilteredUsers = updateStatusInArray(state.statusFilteredUsers);
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(changePassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(changePassword.fulfilled, (state) => { state.loading = false; })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUsersByTeam.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsersByTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.usersByTeam[action.payload.teamId] = action.payload.users;
      })
      .addCase(fetchUsersByTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMyTeamUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyTeamUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.myTeamUsers = action.payload;
      })
      .addCase(fetchMyTeamUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEmployeeHistory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEmployeeHistory.fulfilled, (state, action: PayloadAction<ActivityLogResponseDto[]>) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchEmployeeHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(quickAssign.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(quickAssign.fulfilled, (state) => { state.loading = false; })
      .addCase(quickAssign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTeamLeads.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTeamLeads.fulfilled, (state, action: PayloadAction<TeamLeadResponseDto[]>) => {
        state.loading = false;
        state.teamLeads = action.payload;
      })
      .addCase(fetchTeamLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearUsers,
  clearError,
  clearHistory,
  clearTeamLeads,
  clearStatusFilteredUsers,
  resetStatusPagination,
} = usersSlice.actions;

export default usersSlice.reducer;