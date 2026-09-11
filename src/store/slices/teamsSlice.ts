// src/store/slices/teamsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Team {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
  teamLeadId: number | null;
  teamLeadName: string | null;
  active: boolean;
}

export interface TeamUser {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: number | null;
  departmentName: string | null;
  teamId: number | null;
  teamName: string | null;
  roleId: number | null;
  roleName: string | null;
  active: boolean;
}

// ============================================================
// NEW: Status filter state (with infinite scroll support)
// ============================================================
interface TeamsState {
  list: Team[];
  currentTeam: Team | null;
  departmentTeams: Team[];
  teamUsers: TeamUser[];
  // ✅ Status filter state
  statusFilteredTeams: Team[];
  statusTotal: number;
  statusPage: number;
  statusSize: number;
  statusHasMore: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: TeamsState = {
  list: [],
  currentTeam: null,
  departmentTeams: [],
  teamUsers: [],
  statusFilteredTeams: [],
  statusTotal: 0,
  statusPage: 0,
  statusSize: 20,
  statusHasMore: true,
  loading: false,
  error: null,
};

// Helper to map API team object to Team interface
const mapTeam = (apiTeam: any): Team => ({
  id: apiTeam.teamId,
  name: apiTeam.name,
  departmentId: apiTeam.departmentId,
  departmentName: apiTeam.departmentName,
  teamLeadId: apiTeam.teamLeadId ?? null,
  teamLeadName: apiTeam.teamLeadName ?? null,
  active: apiTeam.active,
});

// ------------------------------
// EXISTING THUNKS
// ------------------------------

export const fetchTeams = createAsyncThunk(
  'teams/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/teams');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teams');
    }
  }
);

export const fetchTeamsByDepartment = createAsyncThunk(
  'teams/fetchByDepartment',
  async (departmentId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/teams/department/${departmentId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teams by department');
    }
  }
);

export const createTeam = createAsyncThunk(
  'teams/create',
  async (teamData: { name: string; departmentId: number }, { rejectWithValue }) => {
    try {
      const response = await api.post('/teams', teamData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create team');
    }
  }
);

export const fetchTeamById = createAsyncThunk(
  'teams/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/teams/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team');
    }
  }
);

export const updateTeam = createAsyncThunk(
  'teams/update',
  async ({ id, name, departmentId }: { id: number; name: string; departmentId: number }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/teams/${id}`, { name, departmentId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update team');
    }
  }
);

export const deactivateTeam = createAsyncThunk(
  'teams/deactivate',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/teams/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate team');
    }
  }
);

export const activateTeam = createAsyncThunk(
  'teams/activate',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.patch(`/teams/${id}/activate`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate team');
    }
  }
);

export const fetchUsersByTeam = createAsyncThunk(
  'teams/fetchUsers',
  async (teamId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/teams/${teamId}/users`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team users');
    }
  }
);

export const assignTeamLead = createAsyncThunk(
  'teams/assignLead',
  async (
    { teamId, employeeId, override = false }: { teamId: number; employeeId: number; override?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(`/teams/${teamId}/assign-lead/${employeeId}?override=${override}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign team lead');
    }
  }
);

// ============================================================
// ✅ NEW: FETCH TEAMS BY STATUS (PAGINATED)
// ============================================================
export const fetchTeamsByStatus = createAsyncThunk(
  'teams/fetchByStatus',
  async ({ active, page = 0, size = 20, append = false }: 
    { active: boolean; page?: number; size?: number; append?: boolean }, 
    { rejectWithValue }) => {
    try {
      const response = await api.get('/teams/status', { params: { active, page, size } });
      return { active, data: response.data, append };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teams by status');
    }
  }
);

// ------------------------------
// SLICE
// ------------------------------
const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearTeams: (state) => {
      state.list = [];
      state.currentTeam = null;
      state.departmentTeams = [];
      state.teamUsers = [];
      state.statusFilteredTeams = [];
      state.statusTotal = 0;
      state.statusPage = 0;
      state.statusSize = 20;
      state.statusHasMore = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDepartmentTeams: (state) => {
      state.departmentTeams = [];
    },
    clearTeamUsers: (state) => {
      state.teamUsers = [];
    },
    // ✅ New reducers for status filter
    clearStatusFilteredTeams: (state) => {
      state.statusFilteredTeams = [];
      state.statusTotal = 0;
      state.statusPage = 0;
      state.statusSize = 20;
      state.statusHasMore = true;
    },
    resetStatusPagination: (state) => {
      state.statusFilteredTeams = [];
      state.statusPage = 0;
      state.statusHasMore = true;
      state.statusTotal = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- EXISTING REDUCERS ----------
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.list = action.payload.map(mapTeam);
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchTeamsByDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamsByDepartment.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.departmentTeams = action.payload.map(mapTeam);
      })
      .addCase(fetchTeamsByDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const newTeam = mapTeam(action.payload);
        state.list.push(newTeam);
        state.departmentTeams.push(newTeam);
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchTeamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.currentTeam = mapTeam(action.payload);
      })
      .addCase(fetchTeamById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeam.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = mapTeam(action.payload);
        const index = state.list.findIndex(t => t.id === updated.id);
        if (index !== -1) state.list[index] = updated;
        const deptIndex = state.departmentTeams.findIndex(t => t.id === updated.id);
        if (deptIndex !== -1) state.departmentTeams[deptIndex] = updated;
        if (state.currentTeam?.id === updated.id) {
          state.currentTeam = updated;
        }
        // Update statusFilteredTeams
        const statusIdx = state.statusFilteredTeams.findIndex(t => t.id === updated.id);
        if (statusIdx !== -1) state.statusFilteredTeams[statusIdx] = updated;
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deactivateTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateTeam.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const id = action.payload;
        const team = state.list.find(t => t.id === id);
        if (team) team.active = false;
        const deptTeam = state.departmentTeams.find(t => t.id === id);
        if (deptTeam) deptTeam.active = false;
        if (state.currentTeam?.id === id) {
          state.currentTeam.active = false;
        }
        const statusTeam = state.statusFilteredTeams.find(t => t.id === id);
        if (statusTeam) statusTeam.active = false;
      })
      .addCase(deactivateTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(activateTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateTeam.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const id = action.payload;
        const team = state.list.find(t => t.id === id);
        if (team) team.active = true;
        const deptTeam = state.departmentTeams.find(t => t.id === id);
        if (deptTeam) deptTeam.active = true;
        if (state.currentTeam?.id === id) {
          state.currentTeam.active = true;
        }
        const statusTeam = state.statusFilteredTeams.find(t => t.id === id);
        if (statusTeam) statusTeam.active = true;
      })
      .addCase(activateTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchUsersByTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersByTeam.fulfilled, (state, action: PayloadAction<TeamUser[]>) => {
        state.loading = false;
        state.teamUsers = action.payload;
      })
      .addCase(fetchUsersByTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(assignTeamLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignTeamLead.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updatedTeam = mapTeam(action.payload);
        const index = state.list.findIndex(t => t.id === updatedTeam.id);
        if (index !== -1) state.list[index] = updatedTeam;
        const deptIndex = state.departmentTeams.findIndex(t => t.id === updatedTeam.id);
        if (deptIndex !== -1) state.departmentTeams[deptIndex] = updatedTeam;
        if (state.currentTeam?.id === updatedTeam.id) {
          state.currentTeam = updatedTeam;
        }
        const statusIdx = state.statusFilteredTeams.findIndex(t => t.id === updatedTeam.id);
        if (statusIdx !== -1) state.statusFilteredTeams[statusIdx] = updatedTeam;
      })
      .addCase(assignTeamLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---------- ✅ NEW: fetchTeamsByStatus ----------
      .addCase(fetchTeamsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamsByStatus.fulfilled, (state, action: PayloadAction<{ active: boolean; data: any; append: boolean }>) => {
        state.loading = false;
        const pageData = action.payload.data;
        const content = (pageData.content || []).map(mapTeam);
        const totalElements = pageData.totalElements || 0;
        const pageNumber = pageData.number || 0;
        const size = pageData.size || 20;

        state.statusPage = pageNumber;
        state.statusSize = size;
        state.statusTotal = totalElements;
        state.statusHasMore = (pageNumber + 1) * size < totalElements;

        if (action.payload.append) {
          state.statusFilteredTeams = [...state.statusFilteredTeams, ...content];
        } else {
          state.statusFilteredTeams = content;
        }
      })
      .addCase(fetchTeamsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.statusHasMore = false;
      });
  },
});

export const { clearTeams, clearError, clearDepartmentTeams, clearTeamUsers, clearStatusFilteredTeams, resetStatusPagination } = teamsSlice.actions;
export default teamsSlice.reducer;