import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { flushPersistedState } from '@/redux/persistFlush';
import { isApiClientError } from '@/services/api/errors';
import { authService } from '@/services/auth.service';
import { profileService } from '@/services/profile.service';
import type { PasswordResetOtpResponse } from '@/types/api';
import type {
  AuthResponse,
  AuthState,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginCredentials,
  LoginRejectedPayload,
  ResetPasswordPayload,
  SendOtpPayload,
  SignupCredentials,
  User,
  VerifyOtpPayload,
} from '@/types/auth';
import { getErrorMessage } from '@/utils/error';

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  pendingAuth: null,
  otpEmail: null,
  pendingPasswordResetEmail: null,
  passwordResetToken: null,
  passwordResetVerified: false,
};

function applyAuthResponse(state: AuthState, response: AuthResponse) {
  state.user = response.user;
  state.token = response.token;
  if (response.refreshToken) {
    state.refreshToken = response.refreshToken;
  }
  state.isAuthenticated = Boolean(response.token);
  state.pendingAuth = null;
  state.otpEmail = null;
  state.error = null;
}

type RefreshReject = { message: string; fatal: boolean };
type FetchUserReject = { message: string; fatal: boolean };

/** Single in-flight refresh so parallel 401 handlers don't race. */
let inflightRefresh: Promise<AuthResponse> | null = null;

function refreshWithLock(refreshToken: string): Promise<AuthResponse> {
  if (!inflightRefresh) {
    inflightRefresh = authService.refresh(refreshToken).finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: LoginRejectedPayload }
>('auth/login', async (credentials, { dispatch, rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    await dispatch(fetchCurrentUser(response.token));
    // Flush after this thunk's fulfilled reducer writes tokens to state.
    setTimeout(() => {
      void flushPersistedState();
    }, 0);
    return response;
  } catch (error) {
    if (isApiClientError(error) && error.code === 'EMAIL_NOT_VERIFIED') {
      return rejectWithValue({
        message: error.message,
        code: error.code,
        email: credentials.email,
      });
    }
    return rejectWithValue({
      message: getErrorMessage(error, 'Login failed'),
    });
  }
});

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (credentials: SignupCredentials, { rejectWithValue }) => {
    try {
      const { confirmPassword: _, ...payload } = credentials;
      return await authService.signup(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Signup failed'));
    }
  },
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: VerifyOtpPayload, { dispatch, getState, rejectWithValue }) => {
    try {
      const { pendingAuth, token } = (getState() as { auth: AuthState }).auth;
      const bearer = token ?? pendingAuth?.token;
      const result = await authService.verifyOtp(payload, bearer);

      if ('resetToken' in result) {
        return { kind: 'password_reset' as const, data: result as PasswordResetOtpResponse };
      }

      const auth = result as AuthResponse;
      await dispatch(fetchCurrentUser(auth.token));
      setTimeout(() => {
        void flushPersistedState();
      }, 0);
      return { kind: 'auth' as const, data: auth };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Verification failed'));
    }
  },
);

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (payload: SendOtpPayload, { rejectWithValue }) => {
    try {
      await authService.sendOtp(payload);
      return payload.email;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not resend code'));
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

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload: ResetPasswordPayload, { getState, rejectWithValue }) => {
    try {
      const { passwordResetVerified, passwordResetToken } = (getState() as { auth: AuthState })
        .auth;
      if (!passwordResetVerified || !passwordResetToken) {
        throw new Error('Please verify your code before updating your password');
      }
      if (payload.resetToken !== passwordResetToken) {
        throw new Error('Reset session expired. Please request a new code.');
      }
      await authService.resetPassword(payload);
      return true;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not update password'));
    }
  },
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (payload: ChangePasswordPayload, { getState, rejectWithValue }) => {
    try {
      const { token } = (getState() as { auth: AuthState }).auth;
      if (!token) throw new Error('Not authenticated');
      await authService.changePassword(payload, token);
      return true;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not change password'));
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const { token, refreshToken } = (getState() as { auth: AuthState }).auth;
  if (token) {
    try {
      await profileService.clearPushToken(token);
    } catch {
      // Best-effort cleanup
    }
    try {
      await authService.logout(token, refreshToken);
    } catch {
      // Clear local session even if API fails
    }
  }
  await flushPersistedState();
});

/**
 * Refresh access token. Serialized so parallel 401 retries share one request.
 * Only `fatal: true` (invalid refresh) clears the local session.
 */
export const refreshSession = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: RefreshReject }
>('auth/refresh', async (_, { getState, rejectWithValue }) => {
  const { refreshToken } = (getState() as { auth: AuthState }).auth;
  if (!refreshToken) {
    return rejectWithValue({ message: 'No refresh token', fatal: true });
  }

  try {
    const result = await refreshWithLock(refreshToken);
    setTimeout(() => {
      void flushPersistedState();
    }, 0);
    return result;
  } catch (error) {
    const unauthorized = isApiClientError(error) && error.status === 401;
    return rejectWithValue({
      message: getErrorMessage(error, 'Session expired'),
      fatal: unauthorized,
    });
  }
});

/**
 * Loads `/users/me`. On expired access token, refreshes first.
 * Network errors keep the local session (stay logged in until manual logout).
 */
export const fetchCurrentUser = createAsyncThunk<
  Awaited<ReturnType<typeof profileService.getMe>>,
  string | undefined,
  { rejectValue: FetchUserReject }
>('auth/fetchCurrentUser', async (accessToken, { getState, dispatch, rejectWithValue }) => {
  const tryRefreshThenMe = async () => {
    const refreshResult = await dispatch(refreshSession());
    if (!refreshSession.fulfilled.match(refreshResult)) {
      const fatal = refreshResult.payload?.fatal === true;
      return rejectWithValue({
        message: refreshResult.payload?.message ?? 'Session expired',
        fatal,
      });
    }
    const nextToken = refreshResult.payload.token;
    try {
      return await profileService.getMe(nextToken);
    } catch (retryError) {
      const unauthorized = isApiClientError(retryError) && retryError.status === 401;
      return rejectWithValue({
        message: getErrorMessage(retryError, 'Could not load profile'),
        fatal: unauthorized,
      });
    }
  };

  const token =
    accessToken ?? (getState() as { auth: AuthState }).auth.token ?? undefined;

  if (!token) {
    const { refreshToken } = (getState() as { auth: AuthState }).auth;
    if (refreshToken) {
      return tryRefreshThenMe();
    }
    return rejectWithValue({ message: 'No token', fatal: true });
  }

  try {
    return await profileService.getMe(token);
  } catch (error) {
    const unauthorized = isApiClientError(error) && error.status === 401;
    if (unauthorized) {
      return tryRefreshThenMe();
    }

    return rejectWithValue({
      message: getErrorMessage(error, 'Could not load profile'),
      fatal: false,
    });
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken?: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.isAuthenticated = true;
      state.error = null;
    },
    setOtpEmail: (state, action: PayloadAction<string>) => {
      state.otpEmail = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: () => initialState,
    clearPendingAuth: (state) => {
      state.pendingAuth = null;
      state.otpEmail = null;
    },
    clearPasswordReset: (state) => {
      state.pendingPasswordResetEmail = null;
      state.passwordResetToken = null;
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
      const payload = action.payload;
      if (payload && typeof payload === 'object' && 'message' in payload) {
        state.error = String((payload as LoginRejectedPayload).message);
      } else {
        state.error = (payload as string) ?? 'Something went wrong';
      }
    };

    builder
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        applyAuthResponse(state, action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        if (payload?.code === 'EMAIL_NOT_VERIFIED' && payload.email) {
          state.otpEmail = payload.email;
          state.error = payload.message;
        } else {
          state.error = payload?.message ?? 'Login failed';
        }
      })
      .addCase(signupUser.pending, handlePending)
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingAuth = action.payload;
        state.otpEmail = action.payload.user.email;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
        state.error = null;
      })
      .addCase(signupUser.rejected, handleRejected)
      .addCase(verifyOtp.pending, handlePending)
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.kind === 'auth') {
          applyAuthResponse(state, action.payload.data);
        } else {
          state.passwordResetToken = action.payload.data.resetToken;
          state.passwordResetVerified = true;
        }
      })
      .addCase(verifyOtp.rejected, handleRejected)
      .addCase(sendOtp.pending, handlePending)
      .addCase(sendOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendOtp.rejected, handleRejected)
      .addCase(forgotPassword.pending, handlePending)
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingPasswordResetEmail = action.payload;
        state.passwordResetToken = null;
        state.passwordResetVerified = false;
      })
      .addCase(forgotPassword.rejected, handleRejected)
      .addCase(resetPassword.pending, handlePending)
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.pendingPasswordResetEmail = null;
        state.passwordResetToken = null;
        state.passwordResetVerified = false;
      })
      .addCase(resetPassword.rejected, handleRejected)
      .addCase(changePassword.pending, handlePending)
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, handleRejected)
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(logoutUser.rejected, () => initialState)
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (_state, action) => {
        // Only wipe when refresh token is definitively invalid.
        if (action.payload?.fatal) {
          return initialState;
        }
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.token = action.payload.token;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
        state.isAuthenticated = true;
      })
      .addCase(refreshSession.rejected, (_state, action) => {
        // Network/server errors must NOT log the user out.
        if (action.payload?.fatal) {
          return initialState;
        }
      });
  },
});

export const {
  setCredentials,
  setOtpEmail,
  setUser,
  logout,
  clearAuthError,
  clearPendingAuth,
  clearPasswordReset,
} = authSlice.actions;
export default authSlice.reducer;
