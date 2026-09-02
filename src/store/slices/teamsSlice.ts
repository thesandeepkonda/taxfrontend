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

interface TeamsState {
  list: Team[];
  currentTeam: Team | null;
  departmentTeams: Team[]; // ✅ New: Teams filtered by department
  loading: boolean;
  error: string | null;
}

const initialState: TeamsState = {
  list: [],
  currentTeam: null,
  departmentTeams: [], // ✅ New
  loading: false,
  error: null,
};

// ✅ Async Thunk: Fetch all teams
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

// ✅ NEW: Fetch teams by department ID
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

// ✅ Async Thunk: Create a new team
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

// ✅ Async Thunk: Get team by ID
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

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearTeams: (state) => {
      state.list = [];
      state.currentTeam = null;
      state.departmentTeams = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDepartmentTeams: (state) => {
      state.departmentTeams = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all teams
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action: PayloadAction<Team[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // ✅ Fetch teams by department
      .addCase(fetchTeamsByDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamsByDepartment.fulfilled, (state, action: PayloadAction<Team[]>) => {
        state.loading = false;
        state.departmentTeams = action.payload;
      })
      .addCase(fetchTeamsByDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create team
      .addCase(createTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action: PayloadAction<Team>) => {
        state.loading = false;
        state.list.push(action.payload);
        state.departmentTeams.push(action.payload); // ✅ Also add to department teams
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch team by ID
      .addCase(fetchTeamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamById.fulfilled, (state, action: PayloadAction<Team>) => {
        state.loading = false;
        state.currentTeam = action.payload;
      })
      .addCase(fetchTeamById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTeams, clearError, clearDepartmentTeams } = teamsSlice.actions;
export default teamsSlice.reducer;