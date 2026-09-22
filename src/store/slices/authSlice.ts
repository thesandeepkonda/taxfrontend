// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface User {
  id: string;
  employeeCode: string;
  name?: string;
  role: 'ADMIN' | 'TEAMLEAD' | 'EMPLOYEE';
  team: 'NONE' | 'DOCUMENTATION' | 'PREPARATION' | 'ESTIMATION' | 'PAYMENTS' | 'E-FILING' | 'SYSTEM' | 'DOCUMENTATION DEPARTMENT';
  departmentId?: number | null;
  departmentName?: string | null;
  teamId?: number | null;
  teamName?: string | null;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  // ✅ NEW: Forgot/Reset password state
  loading: boolean;
  error: string | null;
  forgotPasswordSuccess: boolean;
  resetPasswordSuccess: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  // ✅ NEW
  loading: false,
  error: null,
  forgotPasswordSuccess: false,
  resetPasswordSuccess: false,
};

// ============================================================
// ✅ NEW: FORGOT PASSWORD
// POST /api/users/forgot-password  →  Sends OTP to email
// ============================================================
export interface ForgotPasswordRequest {
  email: string;
}

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (data: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/forgot-password', data);
      return response.data; // MessageResponseDto { success, message }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    }
  }
);

// ============================================================
// ✅ NEW: RESET PASSWORD
// POST /api/users/reset-password  →  Verify OTP + Set new password
// ============================================================
export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/reset-password', data);
      return response.data; // MessageResponseDto { success, message }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reset password. Please try again.'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.forgotPasswordSuccess = false;
      state.resetPasswordSuccess = false;
    },
    updateToken: (state, action: PayloadAction<{ accessToken: string }>) => {
      state.accessToken = action.payload.accessToken;
    },
    // ✅ NEW: Clear error manually
    clearAuthError: (state) => {
      state.error = null;
    },
    // ✅ NEW: Reset forgot/reset success flags
    resetForgotPasswordState: (state) => {
      state.forgotPasswordSuccess = false;
      state.resetPasswordSuccess = false;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- FORGOT PASSWORD ----------
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.forgotPasswordSuccess = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.forgotPasswordSuccess = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.forgotPasswordSuccess = false;
      })
      // ---------- RESET PASSWORD ----------
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetPasswordSuccess = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.resetPasswordSuccess = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.resetPasswordSuccess = false;
      });
  },
});

export const {
  setCredentials,
  logout,
  updateToken,
  clearAuthError,
  resetForgotPasswordState,
} = authSlice.actions;

export default authSlice.reducer;