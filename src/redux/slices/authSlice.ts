import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { authService } from '@/services/auth.service';
import type {
  AuthState,
  ForgotPasswordPayload,
  LoginCredentials,
  ResendOtpPayload,
  SignupCredentials,
  User,
  UpdatePasswordPayload,
  VerifyOtpPayload,
} from '@/types/auth';
import { getErrorMessage } from '@/utils/error';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  pendingAuth: null,
  otpEmail: null,
  pendingPasswordResetEmail: null,
  passwordResetVerified: false,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Login failed'));
    }
  },
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (credentials: SignupCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.signup(credentials);
      await authService.sendSignupOtp({ email: credentials.email });
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Signup failed'));
    }
  },
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: VerifyOtpPayload, { getState, rejectWithValue }) => {
    try {
      const { pendingAuth } = (getState() as { auth: AuthState }).auth;
      return await authService.verifyOtp(payload, pendingAuth);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Verification failed'));
    }
  },
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (payload: ResendOtpPayload, { rejectWithValue }) => {
    try {
      await authService.sendSignupOtp(payload);
      return payload.email;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not resend code'));
    }
  },
);

export const verifyResetOtp = createAsyncThunk(
  'auth/verifyResetOtp',
  async (payload: VerifyOtpPayload, { getState, rejectWithValue }) => {
    try {
      const { pendingPasswordResetEmail } = (getState() as { auth: AuthState }).auth;
      await authService.verifyResetPasswordOtp(payload, pendingPasswordResetEmail);
      return payload.email;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Verification failed'));
    }
  },
);

export const resendResetOtp = createAsyncThunk(
  'auth/resendResetOtp',
  async (payload: ResendOtpPayload, { rejectWithValue }) => {
    try {
      await authService.sendResetPasswordOtp(payload);
      return payload.email;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not resend code'));
    }
  },
);

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (payload: UpdatePasswordPayload, { getState, rejectWithValue }) => {
    try {
      const { passwordResetVerified, pendingPasswordResetEmail } = (getState() as {
        auth: AuthState;
      }).auth;
      if (!passwordResetVerified || pendingPasswordResetEmail !== payload.email) {
        throw new Error('Please verify your code before updating your password');
      }
      await authService.updatePassword(payload);
      return payload.email;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update password'));
    }
  },
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (payload: ForgotPasswordPayload, { rejectWithValue }) => {
    try {
      await authService.forgotPassword(payload);
      return payload.email;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Request failed'));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      state.pendingAuth = null;
      state.otpEmail = null;
      state.pendingPasswordResetEmail = null;
      state.passwordResetVerified = false;
    },
    clearPendingAuth: (state) => {
      state.pendingAuth = null;
      state.otpEmail = null;
    },
    clearPasswordReset: (state) => {
      state.pendingPasswordResetEmail = null;
      state.passwordResetVerified = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.isLoading = true;
      state.error = null;
    };
    const handleRejected = (state: AuthState, action: { payload: unknown }) => {
      state.isLoading = false;
      state.error = (action.payload as string) ?? 'Something went wrong';
    };

    builder
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, handleRejected)
      .addCase(signupUser.pending, handlePending)
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingAuth = action.payload;
        state.otpEmail = action.payload.user.email;
        state.error = null;
      })
      .addCase(signupUser.rejected, handleRejected)
      .addCase(verifyOtp.pending, handlePending)
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.pendingAuth = null;
        state.otpEmail = null;
      })
      .addCase(verifyOtp.rejected, handleRejected)
      .addCase(resendOtp.pending, handlePending)
      .addCase(resendOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendOtp.rejected, handleRejected)
      .addCase(verifyResetOtp.pending, handlePending)
      .addCase(verifyResetOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.passwordResetVerified = true;
      })
      .addCase(verifyResetOtp.rejected, handleRejected)
      .addCase(resendResetOtp.pending, handlePending)
      .addCase(resendResetOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendResetOtp.rejected, handleRejected)
      .addCase(updatePassword.pending, handlePending)
      .addCase(updatePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.pendingPasswordResetEmail = null;
        state.passwordResetVerified = false;
      })
      .addCase(updatePassword.rejected, handleRejected)
      .addCase(forgotPassword.pending, handlePending)
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingPasswordResetEmail = action.payload;
        state.passwordResetVerified = false;
      })
      .addCase(forgotPassword.rejected, handleRejected);
  },
});

export const { setCredentials, logout, clearAuthError, clearPendingAuth, clearPasswordReset } =
  authSlice.actions;
export default authSlice.reducer;
