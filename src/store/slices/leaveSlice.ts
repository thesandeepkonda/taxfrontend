// src/store/slices/leaveSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface LeaveRequestResponse {
  leaveId: number;
  employeeCode: string;
  employeeName: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'COMP_OFF' | 'OTHER';
  fromDate: string;
  toDate: string;
  totalDays: number;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedAt: string;
  adminRemark: string | null;
  processedByName: string | null;
  processedAt: string | null;
}

export interface CreateLeaveRequest {
  leaveType: string;
  fromDate: string;
  toDate: string;
  description?: string;
}

interface LeaveState {
  myLeaves: LeaveRequestResponse[];
  pendingLeaves: LeaveRequestResponse[];
  currentLeave: LeaveRequestResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  myLeaves: [],
  pendingLeaves: [],
  currentLeave: null,
  loading: false,
  error: null,
};

// Create leave request
export const createLeaveRequest = createAsyncThunk(
  'leave/create',
  async (data: CreateLeaveRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/leave-requests', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply for leave');
    }
  }
);

// Get my leave requests
export const fetchMyLeaveRequests = createAsyncThunk(
  'leave/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/leave-requests/my');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my leaves');
    }
  }
);

// Get pending leave requests (admin)
export const fetchPendingLeaveRequests = createAsyncThunk(
  'leave/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/leave-requests/pending');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending leaves');
    }
  }
);

// Approve leave (admin)
export const approveLeave = createAsyncThunk(
  'leave/approve',
  async ({ leaveId, remark }: { leaveId: number; remark?: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leave-requests/${leaveId}/approve`, null, {
        params: { remark },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve leave');
    }
  }
);

// Reject leave (admin)
export const rejectLeave = createAsyncThunk(
  'leave/reject',
  async ({ leaveId, remark }: { leaveId: number; remark?: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leave-requests/${leaveId}/reject`, null, {
        params: { remark },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject leave');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearLeaves(state) {
      state.myLeaves = [];
      state.pendingLeaves = [];
      state.currentLeave = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createLeaveRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequestResponse>) => {
        state.loading = false;
        state.myLeaves.unshift(action.payload);
      })
      .addCase(createLeaveRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMyLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action: PayloadAction<LeaveRequestResponse[]>) => {
        state.loading = false;
        state.myLeaves = action.payload;
      })
      .addCase(fetchMyLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPendingLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingLeaveRequests.fulfilled, (state, action: PayloadAction<LeaveRequestResponse[]>) => {
        state.loading = false;
        state.pendingLeaves = action.payload;
      })
      .addCase(fetchPendingLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(approveLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveLeave.fulfilled, (state, action: PayloadAction<LeaveRequestResponse>) => {
        state.loading = false;
        // Update both lists if present
        const idxMy = state.myLeaves.findIndex(l => l.leaveId === action.payload.leaveId);
        if (idxMy !== -1) state.myLeaves[idxMy] = action.payload;
        const idxPending = state.pendingLeaves.findIndex(l => l.leaveId === action.payload.leaveId);
        if (idxPending !== -1) state.pendingLeaves[idxPending] = action.payload;
        // Also set current if matching
        if (state.currentLeave?.leaveId === action.payload.leaveId) state.currentLeave = action.payload;
      })
      .addCase(approveLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(rejectLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectLeave.fulfilled, (state, action: PayloadAction<LeaveRequestResponse>) => {
        state.loading = false;
        const idxMy = state.myLeaves.findIndex(l => l.leaveId === action.payload.leaveId);
        if (idxMy !== -1) state.myLeaves[idxMy] = action.payload;
        const idxPending = state.pendingLeaves.findIndex(l => l.leaveId === action.payload.leaveId);
        if (idxPending !== -1) state.pendingLeaves[idxPending] = action.payload;
        if (state.currentLeave?.leaveId === action.payload.leaveId) state.currentLeave = action.payload;
      })
      .addCase(rejectLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLeaves, clearError } = leaveSlice.actions;
export default leaveSlice.reducer;