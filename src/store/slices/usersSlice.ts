// src/store/slices/usersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { apiDev1 } from '../../services/api';

// ============================================================
// TYPES (Matching Backend DTOs)
// ============================================================
export interface User {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string;
  departmentId: number | null;
  departmentName: string | null;
  teamId: number | null;
  teamName: string | null;
  roleId: number | null;
  roleName: string | null;
  temporaryPassword: string | null;
  active: boolean;
  attendancePolicyId: number | null;
  attendancePolicyName: string | null;
  workMode: 'OFFICE' | 'WORK_FROM_HOME' | 'HYBRID';
}

export interface UpdateEmployeeRequest {
  firstName: string;
  lastName?: string | null;
  email: string;
  phone: string;
  departmentId: number;
  teamId?: number | null;
  roleId?: number | null;
  active: boolean;
  attendancePolicyId: number;
  workMode: 'OFFICE' | 'WORK_FROM_HOME' | 'HYBRID';
}

// ============================================================
// CHANGE PASSWORD SECTION (Request DTO)
// ============================================================
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
// ============================================================

export interface ActivityLogResponseDto {
  id: number;
  performedBy: string;
  actionType: string;
  description: string;
  timestamp: string;
}

export interface QuickAssignRequestDto {
  teamId?: number | null;
  departmentId?: number | null;
  roleId?: number | null;
}

export interface TeamLeadResponseDto {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  email: string;
  departmentId: number | null;
  departmentName: string;
  teamId: number | null;
  teamName: string;
}

// ============================================================
// STATE
// ============================================================
interface UsersState {
  list: User[];
  currentUser: User | null;
  usersByTeam: Record<number, User[]>;
  myTeamUsers: User[]; // NEW: To store logged in Team Lead's users
  history: ActivityLogResponseDto[];
  teamLeads: TeamLeadResponseDto[];
  
  // Status filter specific state (with infinite scroll support)
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
// ASYNC THUNKS
// ============================================================

// GET /users/{id}
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

// GET /users (All - No Pagination)
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

// GET /users/status?active={boolean}&page={page}&size={size}
export const fetchUsersByStatus = createAsyncThunk(
  'users/fetchByStatus',
  async ({ active, page = 0, size = 20, append = false }: 
    { active: boolean; page?: number; size?: number; append?: boolean }, 
    { rejectWithValue }) => {
    try {
      const response = await api.get('/users/status', { params: { active, page, size } });
      return { active, data: response.data, append };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users by status');
    }
  }
);

// POST /users
export const createEmployee = createAsyncThunk(
  'users/create',
  async (userData: {
    employeeCode: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    phone: string;
    departmentId: number;
    teamId?: number | null;
    roleId?: number | null;
    attendancePolicyId: number;
    workMode: 'OFFICE' | 'WORK_FROM_HOME' | 'HYBRID';
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
    }
  }
);

// PUT /users/{id} - Update Employee
export const updateEmployee = createAsyncThunk(
  'users/update',
  async ({ id, ...updateData }: { id: number } & UpdateEmployeeRequest, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update employee');
    }
  }
);

// PATCH /users/{id}/status
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

// ============================================================
// CHANGE PASSWORD SECTION (ASYNC THUNK)
// ============================================================
// PUT /users/change-password
export const changePassword = createAsyncThunk(
  'users/changePassword',
  async (passwordData: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      await api.put('/users/change-password', passwordData);
      return; // Success (void)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);
// ============================================================

// GET /teams/{teamId}/users
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

// NEW: GET /teams/my-team/users
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

// GET /api/users/{id}/history
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

// PATCH /api/users/{id}/quick-assign
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

// GET /api/users/team-leads
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
    clearError: (state) => {
      state.error = null;
    },
    clearHistory: (state) => {
      state.history = [];
    },
    clearTeamLeads: (state) => {
      state.teamLeads = [];
    },
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
      // ---------- fetchUserDetails ----------
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
      // ---------- fetchUsers ----------
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
      // ---------- fetchUsersByStatus ----------
      .addCase(fetchUsersByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
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
      // ---------- createEmployee ----------
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
      // ---------- updateEmployee ----------
      .addCase(updateEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        const updated = action.payload;
        
        const updateInArray = (users: User[]) => {
          const index = users.findIndex(u => u.id === updated.id);
          if (index !== -1) users[index] = updated;
          return users;
        };

        state.list = updateInArray(state.list);
        if (state.currentUser?.id === updated.id) {
          state.currentUser = updated;
        }
        state.statusFilteredUsers = updateInArray(state.statusFilteredUsers);
        
        Object.keys(state.usersByTeam).forEach((teamId) => {
          const teamUsers = state.usersByTeam[Number(teamId)];
          const idx = teamUsers.findIndex(u => u.id === updated.id);
          if (idx !== -1) teamUsers[idx] = updated;
        });
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ---------- updateUserStatus ----------
      .addCase(updateUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action: PayloadAction<{ userId: number; active: boolean }>) => {
        state.loading = false;
        const { userId, active } = action.payload;

        const updateStatusInArray = (users: User[]) => {
          const user = users.find(u => u.id === userId);
          if (user) {
            user.active = active;
          }
          return users;
        };

        state.list = updateStatusInArray(state.list);
        if (state.currentUser?.id === userId) {
          state.currentUser.active = active;
        }
        state.statusFilteredUsers = updateStatusInArray(state.statusFilteredUsers);
        
        Object.keys(state.usersByTeam).forEach((teamId) => {
          const teamUsers = state.usersByTeam[Number(teamId)];
          const user = teamUsers.find(u => u.id === userId);
          if (user) {
            user.active = active;
          }
        });
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ============================================================
      // CHANGE PASSWORD SECTION (EXTRA REDUCERS)
      // ============================================================
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        // Password changed successfully - no state change needed
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ============================================================
      // ---------- fetchUsersByTeam ----------
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
      })
      // ---------- fetchMyTeamUsers ----------
      .addCase(fetchMyTeamUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTeamUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.myTeamUsers = action.payload;
      })
      .addCase(fetchMyTeamUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ---------- fetchEmployeeHistory ----------
      .addCase(fetchEmployeeHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeHistory.fulfilled, (state, action: PayloadAction<ActivityLogResponseDto[]>) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchEmployeeHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ---------- quickAssign ----------
      .addCase(quickAssign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(quickAssign.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(quickAssign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ---------- fetchTeamLeads ----------
      .addCase(fetchTeamLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
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