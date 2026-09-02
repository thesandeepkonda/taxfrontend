// src/store/slices/employeeClientSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Pageable } from './types';

export interface AssignedClientResponse {
  clientId: number;
  name: string;
  phone: string; // masked
  email: string; // masked
  status: string;
  nextFollowUpAt: string | null;
  callInProgress: boolean;
  lastCalledAt: string | null;
}

interface EmployeeClientState {
  clients: AssignedClientResponse[];
  total: number;
  currentClient: AssignedClientResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeClientState = {
  clients: [],
  total: 0,
  currentClient: null,
  loading: false,
  error: null,
};

// Get my assigned clients
export const fetchMyClients = createAsyncThunk(
  'employeeClient/fetchMy',
  async (pageable: Pageable, { rejectWithValue }) => {
    try {
      const response = await api.get('/employee/clients', { params: pageable });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients');
    }
  }
);

// Get a specific client
export const fetchMyClientById = createAsyncThunk(
  'employeeClient/fetchById',
  async (clientId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/employee/clients/${clientId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client');
    }
  }
);

const employeeClientSlice = createSlice({
  name: 'employeeClient',
  initialState,
  reducers: {
    clearEmployeeClients(state) {
      state.clients = [];
      state.total = 0;
      state.currentClient = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyClients.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.clients = action.payload.content || [];
        state.total = action.payload.totalElements || 0;
      })
      .addCase(fetchMyClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMyClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyClientById.fulfilled, (state, action: PayloadAction<AssignedClientResponse>) => {
        state.loading = false;
        state.currentClient = action.payload;
      })
      .addCase(fetchMyClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearEmployeeClients, clearError } = employeeClientSlice.actions;
export default employeeClientSlice.reducer;