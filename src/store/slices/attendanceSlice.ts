// src/store/slices/attendanceSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiDev1 } from '../../services/api';

// ---------- Types ----------
export interface AttendanceResponse {
  id: number;
  employeeId: number;
  employeeCode: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'NOT_CHECKED_OUT' | string;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  totalIdleMinutes: number;
  breakActive: boolean;
  // ✅ NEW flags from backend
  policyViolation: boolean;
  isLate: boolean;
  isEarlyCheckout: boolean;
}

// ✅ Team Attendance Response (For Team Lead)
export interface TeamAttendanceResponse {
  id: number | null;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  attendanceDate: string;
  shiftStartTime: string | null; // HH:mm
  shiftEndTime: string | null;   // HH:mm
  checkIn: string | null;
  checkOut: string | null;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'NOT_CHECKED_OUT' | string;
  currentStatus: string; // "On Shift", "Off Shift", "Upcoming"
  workingDays: string;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  totalIdleMinutes: number;
  breakActive: boolean;
  policyViolation: boolean;
  late: boolean;
  earlyCheckout: boolean;
}

// ✅ Updated: no breaks list, now has allowedBreakMinutes
export interface CreateAttendancePolicyRequest {
  name: string;
  startTime: string; // HH:mm
  endTime: string;
  allowedBreakMinutes: number; // daily allowance
}

export interface AttendancePolicyResponse {
  attendancePolicyId: number;
  name: string;
  startTime: string;
  endTime: string;
  allowedBreakMinutes: number; // NEW
  active: boolean;
}

export interface AttendanceCalendarResponse {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'NOT_CHECKED_OUT' | null;
  checkIn: string | null;
  checkOut: string | null;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  totalIdleMinutes: number;
  onLeave: boolean;
  leaveType: string | null;
  leaveDescription: string | null;
  workMode: string | null;
}

// ---------- State ----------
interface AttendanceState {
  currentAttendance: AttendanceResponse | null;
  currentPolicy: AttendancePolicyResponse | null;
  list: AttendancePolicyResponse[];
  calendar: AttendanceCalendarResponse[];
  teamSchedule: TeamAttendanceResponse[]; // NEW
  teamAttendance: TeamAttendanceResponse[]; // ✅ NEW
  loading: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  currentAttendance: null,
  currentPolicy: null,
  list: [],
  calendar: [],
  teamSchedule: [], // NEW
  teamAttendance: [], // ✅ NEW
  loading: false,
  error: null,
};

// ---------- Async Thunks ----------

// GET /attendance/today
export const fetchTodayAttendance = createAsyncThunk(
  'attendance/fetchToday',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev1.get('/attendance/today');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch today attendance');
    }
  }
);

export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev1.post('/attendance/check-in');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Check-in failed');
    }
  }
);

export const checkOut = createAsyncThunk(
  'attendance/checkOut',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev1.post('/attendance/check-out');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Check-out failed');
    }
  }
);

export const startBreak = createAsyncThunk(
  'attendance/startBreak',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev1.post('/attendance/break/start');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Start break failed');
    }
  }
);

export const endBreak = createAsyncThunk(
  'attendance/endBreak',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev1.post('/attendance/break/end');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'End break failed');
    }
  }
);

export const startIdle = createAsyncThunk(
  'attendance/startIdle',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev1.post('/attendance/idle/start');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Start idle failed');
    }
  }
);

export const endIdle = createAsyncThunk(
  'attendance/endIdle',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev1.post('/attendance/idle/end');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'End idle failed');
    }
  }
);

export const fetchAttendanceCalendar = createAsyncThunk(
  'attendance/fetchCalendar',
  async ({ fromDate, toDate }: { fromDate: string; toDate: string }, { rejectWithValue }) => {
    try {
      const response = await apiDev1.get('/attendance/calendar', {
        params: { fromDate, toDate },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch calendar');
    }
  }
);

export const fetchAttendancePolicy = createAsyncThunk(
  'attendance/fetchPolicy',
  async (policyId: number | string, { rejectWithValue }) => {
    try {
      const response = await apiDev1.get(`/attendance-policies/${policyId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance policy');
    }
  }
);

export const fetchAttendancePolicies = createAsyncThunk(
  'attendance/fetchPolicies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDev1.get('/attendance-policies');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch policies');
    }
  }
);

// NEW: Get policies by status
export const fetchAttendancePoliciesByStatus = createAsyncThunk(
  'attendance/fetchPoliciesByStatus',
  async (active: boolean, { rejectWithValue }) => {
    try {
      const response = await apiDev1.get('/attendance-policies/status', {
        params: { active },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch policies by status');
    }
  }
);

export const createAttendancePolicy = createAsyncThunk(
  'attendance/createPolicy',
  async (policyData: CreateAttendancePolicyRequest, { rejectWithValue }) => {
    try {
      const response = await apiDev1.post('/attendance-policies', policyData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create policy');
    }
  }
);

export const deactivateAttendancePolicy = createAsyncThunk(
  'attendance/deactivatePolicy',
  async (policyId: number, { rejectWithValue }) => {
    try {
      await apiDev1.patch(`/attendance-policies/${policyId}/deactivate`);
      return policyId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate policy');
    }
  }
);

export const activateAttendancePolicy = createAsyncThunk(
  'attendance/activatePolicy',
  async (policyId: number, { rejectWithValue }) => {
    try {
      await apiDev1.patch(`/attendance-policies/${policyId}/activate`);
      return policyId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate policy');
    }
  }
);

// NEW: Fetch Team Schedule
export const fetchTeamSchedule = createAsyncThunk(
  'attendance/fetchTeamSchedule',
  async (date: string, { rejectWithValue }) => {
    try {
      const response = await apiDev1.get('/attendance/my-team', {
        params: { date },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team schedule');
    }
  }
);

// ✅ NEW: Fetch My Team Attendance (Team Lead)
export const fetchMyTeamAttendance = createAsyncThunk(
  'attendance/fetchMyTeam',
  async (date: string | null = null, { rejectWithValue }) => {
    try {
      const params = date ? { date } : {};
      const response = await apiDev1.get('/attendance/my-team', { params });
      return response.data; // List<TeamAttendanceResponse>
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team attendance');
    }
  }
);

// ---------- Slice ----------
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendance: (state) => {
      state.currentAttendance = null;
      state.currentPolicy = null;
      state.list = [];
      state.calendar = [];
      state.teamSchedule = []; // NEW
      state.teamAttendance = []; // ✅ NEW
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Today's Attendance
      .addCase(fetchTodayAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action: PayloadAction<AttendanceResponse>) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(fetchTodayAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Check-in
      .addCase(checkIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkIn.fulfilled, (state, action: PayloadAction<AttendanceResponse>) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Check-out
      .addCase(checkOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkOut.fulfilled, (state, action: PayloadAction<AttendanceResponse>) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Break Start
      .addCase(startBreak.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startBreak.fulfilled, (state, action: PayloadAction<AttendanceResponse>) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(startBreak.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Break End
      .addCase(endBreak.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endBreak.fulfilled, (state, action: PayloadAction<AttendanceResponse>) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(endBreak.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Idle Start
      .addCase(startIdle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startIdle.fulfilled, (state, action: PayloadAction<AttendanceResponse>) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(startIdle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Idle End
      .addCase(endIdle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endIdle.fulfilled, (state, action: PayloadAction<AttendanceResponse>) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(endIdle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Single Policy
      .addCase(fetchAttendancePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendancePolicy.fulfilled, (state, action: PayloadAction<AttendancePolicyResponse>) => {
        state.loading = false;
        state.currentPolicy = action.payload;
      })
      .addCase(fetchAttendancePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch All Policies
      .addCase(fetchAttendancePolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendancePolicies.fulfilled, (state, action: PayloadAction<AttendancePolicyResponse[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAttendancePolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Policies by Status (Active/Inactive)
      .addCase(fetchAttendancePoliciesByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendancePoliciesByStatus.fulfilled, (state, action: PayloadAction<AttendancePolicyResponse[]>) => {
        state.loading = false;
        state.list = action.payload; // Replace list with filtered results
      })
      .addCase(fetchAttendancePoliciesByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Policy
      .addCase(createAttendancePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAttendancePolicy.fulfilled, (state, action: PayloadAction<AttendancePolicyResponse>) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(createAttendancePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Deactivate
      .addCase(deactivateAttendancePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateAttendancePolicy.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const policy = state.list.find(p => p.attendancePolicyId === action.payload);
        if (policy) policy.active = false;
        if (state.currentPolicy?.attendancePolicyId === action.payload) {
          state.currentPolicy.active = false;
        }
      })
      .addCase(deactivateAttendancePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Activate
      .addCase(activateAttendancePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateAttendancePolicy.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const policy = state.list.find(p => p.attendancePolicyId === action.payload);
        if (policy) policy.active = true;
        if (state.currentPolicy?.attendancePolicyId === action.payload) {
          state.currentPolicy.active = true;
        }
      })
      .addCase(activateAttendancePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Calendar
      .addCase(fetchAttendanceCalendar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceCalendar.fulfilled, (state, action: PayloadAction<AttendanceCalendarResponse[]>) => {
        state.loading = false;
        state.calendar = action.payload;
      })
      .addCase(fetchAttendanceCalendar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // NEW: Fetch Team Schedule
      .addCase(fetchTeamSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamSchedule.fulfilled, (state, action: PayloadAction<TeamAttendanceResponse[]>) => {
        state.loading = false;
        state.teamSchedule = action.payload;
      })
      .addCase(fetchTeamSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ✅ NEW: My Team Attendance
      .addCase(fetchMyTeamAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTeamAttendance.fulfilled, (state, action: PayloadAction<TeamAttendanceResponse[]>) => {
        state.loading = false;
        state.teamAttendance = action.payload;
      })
      .addCase(fetchMyTeamAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAttendance, clearError } = attendanceSlice.actions;
export default attendanceSlice.reducer;