import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PersistPartial } from 'redux-persist/es/persistReducer';

import { flushPersistedState } from '@/redux/persistFlush';
import { isApiClientError, isInvalidRefreshError, isUnauthorizedError } from '@/services/api/errors';
import { authService } from '@/services/auth.service';
import { clearPersonalizedNewsCache } from '@/services/personalizedNews.service';
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
import {
  asTokenString,
  clearAuthTokens,
  saveSession,
} from '@/utils/authSessionStorage';
import { getErrorMessage } from '@/utils/error';

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  sessionReady: false,
  isLoading: false,
  error: null,
  pendingAuth: null,
  otpEmail: null,
  pendingPasswordResetEmail: null,
  passwordResetToken: null,
  passwordResetVerified: false,
};

type AuthPersistState = AuthState & PersistPartial;

/** Must keep `_persist` or redux-persist crashes / stops writing. */
function clearedAuthState(state: AuthPersistState): AuthPersistState {
  void clearAuthTokens();
  return { ...initialState, _persist: state._persist };
}

function applyAuthResponse(state: AuthState, response: AuthResponse | null | undefined) {
  if (!response || typeof response !== 'object') return;
  const access = asTokenString(response.token);
  const refresh = asTokenString(response.refreshToken);
  // Never wipe a hydrated user when refresh/login payloads omit user.
  if (response.user) {
    state.user = response.user;
  }
  state.token = access;
  if (refresh) {
    state.refreshToken = refresh;
  }
  state.isAuthenticated = Boolean(access || refresh || state.refreshToken);
  state.pendingAuth = null;
  state.otpEmail = null;
  state.error = null;
  void saveSession({ token: state.token, refreshToken: state.refreshToken, user: state.user });
}

/** Flush after the current action's reducers have applied (e.g. login fulfilled). */
function schedulePersistFlush() {
  setTimeout(() => {
    void flushPersistedState();
  }, 0);
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
    if (__DEV__ && !response.refreshToken) {
      console.warn(
        '[auth] Login response has no refreshToken — session will not survive app restart.',
      );
    }
    // Write tokens into state immediately so we can await a durable disk flush.
    dispatch(
      setCredentials({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
      }),
    );
    await saveSession({
      token: response.token,
      refreshToken: response.refreshToken ?? null,
      user: response.user,
    });
    await flushPersistedState();
    // Profile sync; do not block login persistence on /me failures.
    void dispatch(fetchCurrentUser(response.token));
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
      dispatch(
        setCredentials({
          user: auth.user,
          token: auth.token,
          refreshToken: auth.refreshToken,
        }),
      );
      await flushPersistedState();
      void dispatch(fetchCurrentUser(auth.token));
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

/**
 * API logout best-effort, then clear local session and flush empty auth to disk.
 */
export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState, dispatch }) => {
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
  clearPersonalizedNewsCache();
  dispatch(logout());
  await clearAuthTokens();
  try {
    await flushPersistedState();
  } catch {
    // Local session already cleared; disk flush is best-effort
  }
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
  const refreshToken = asTokenString(
    (getState() as { auth: AuthState | null }).auth?.refreshToken,
  );
  if (!refreshToken) {
    // Refresh is only requested when access is absent or has been rejected.
    await clearAuthTokens();
    return rejectWithValue({
      message: 'No refresh token',
      fatal: true,
    });
  }

  try {
    const result = await refreshWithLock(refreshToken);
    const access = asTokenString(result?.token);
    if (!access) {
      await clearAuthTokens();
      return rejectWithValue({
        message: 'Refresh returned empty token',
        fatal: true,
      });
    }
    await saveSession({
      token: access,
      refreshToken: asTokenString(result.refreshToken) ?? refreshToken,
      user: (getState() as { auth: AuthState }).auth.user,
    });
    schedulePersistFlush();
    return {
      ...result,
      token: access,
      refreshToken: asTokenString(result.refreshToken) ?? refreshToken,
    };
  } catch (error) {
    // Only treat confirmed refresh failures as fatal. Generic "expired token"
    // via isUnauthorizedError was wiping sessions on every cold start.
    const fatal =
      isInvalidRefreshError(error) ||
      (isApiClientError(error) && error.status === 401);
    if (fatal) {
      await clearAuthTokens();
    }
    return rejectWithValue({
      message: getErrorMessage(error, 'Session expired'),
      fatal,
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
    const nextToken = asTokenString(refreshResult.payload?.token);
    if (!nextToken) {
      return rejectWithValue({ message: 'Refresh returned empty token', fatal: true });
    }
    try {
      return await profileService.getMe(nextToken);
    } catch (retryError) {
      const unauthorized = isUnauthorizedError(retryError);
      return rejectWithValue({
        message: getErrorMessage(retryError, 'Could not load profile'),
        fatal: unauthorized,
      });
    }
  };

  const token = asTokenString(
    accessToken ?? (getState() as { auth: AuthState | null }).auth?.token,
  );

  if (!token) {
    const refreshToken = asTokenString(
      (getState() as { auth: AuthState | null }).auth?.refreshToken,
    );
    if (refreshToken) {
      return tryRefreshThenMe();
    }
    await clearAuthTokens();
    return rejectWithValue({ message: 'No token', fatal: true });
  }

  try {
    return await profileService.getMe(token);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      const refreshToken = asTokenString(
        (getState() as { auth: AuthState | null }).auth?.refreshToken,
      );
      if (!refreshToken) {
        await clearAuthTokens();
        return rejectWithValue({ message: 'Session expired', fatal: true });
      }
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
      if (!action.payload) return;
      const access = asTokenString(action.payload.token);
      const refresh = asTokenString(action.payload.refreshToken);
      if (action.payload.user) {
        state.user = action.payload.user;
      }
      state.token = access;
      if (refresh) {
        state.refreshToken = refresh;
      }
      state.isAuthenticated = Boolean(access || refresh || state.refreshToken);
      state.sessionReady = true;
      state.error = null;
      void saveSession({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      });
    },
    setOtpEmail: (state, action: PayloadAction<string>) => {
      state.otpEmail = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => clearedAuthState(state as AuthPersistState),
    setSessionReady: (state, action: PayloadAction<boolean>) => {
      state.sessionReady = action.payload;
    },
    hydrateTokens: (
      state,
      action: PayloadAction<{
        token?: string | null;
        refreshToken?: string | null;
        /** When true, overwrite even with null (clears dirty object tokens). */
        replace?: boolean;
      }>,
    ) => {
      const access = asTokenString(action.payload.token);
      const refresh = asTokenString(action.payload.refreshToken);
      if (action.payload.replace) {
        if ('token' in action.payload) state.token = access;
        if ('refreshToken' in action.payload) state.refreshToken = refresh;
      } else {
        if (access) state.token = access;
        if (refresh) state.refreshToken = refresh;
      }
      state.isAuthenticated = Boolean(state.token || state.refreshToken);
      void saveSession({ token: state.token, refreshToken: state.refreshToken, user: state.user });
    },
    clearPendingAuth: (state) => {
      state.pendingAuth = null;
      state.otpEmail = null;
      // Unwind any accidental live session left from a prior signup bug.
      if (!state.user) {
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        void saveSession({ token: null, refreshToken: null, user: null });
      }
    },
    /** Cold start: unverified accounts must not resume into OTP — show Login instead. */
    clearUnverifiedSession: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.pendingAuth = null;
      state.otpEmail = null;
      state.error = null;
      void saveSession({ token: null, refreshToken: null, user: null });
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
        state.sessionReady = true;
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
        // Keep tokens only in pendingAuth until OTP succeeds. Writing refreshToken
        // into the live session made RootNavigator treat the user as logged-in
        // (hasSession && !user → Main) and skipped OTP + onboarding.
        state.pendingAuth = action.payload;
        state.otpEmail = action.payload.user.email;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        void saveSession({ token: null, refreshToken: null, user: null });
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
      // Local clear already happened via dispatch(logout()) inside the thunk.
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(logoutUser.rejected, (state) => clearedAuthState(state as AuthPersistState))
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = asTokenString(state.token);
        state.refreshToken = asTokenString(state.refreshToken);
        state.isAuthenticated = Boolean(state.token || state.refreshToken);
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        if (action.payload?.fatal) {
          return clearedAuthState(state as AuthPersistState);
        }
        // Keep the local session for temporary network/server failures.
        if (action.payload?.message) {
          state.error = action.payload.message;
        }
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        if (!action.payload) return;
        const access = asTokenString(action.payload.token);
        const refresh = asTokenString(action.payload.refreshToken);
        state.token = access;
        if (refresh) {
          state.refreshToken = refresh;
        }
        // Keep existing user — refresh payload has user: null.
        state.isAuthenticated = Boolean(access || refresh || state.refreshToken);
        void saveSession({ token: state.token, refreshToken: state.refreshToken, user: state.user });
      })
      .addCase(refreshSession.rejected, (state, action) => {
        if (action.payload?.fatal) {
          return clearedAuthState(state as AuthPersistState);
        }
      });
  },
});

export const {
  setCredentials,
  setOtpEmail,
  setUser,
  logout,
  setSessionReady,
  hydrateTokens,
  clearAuthError,
  clearPendingAuth,
  clearUnverifiedSession,
  clearPasswordReset,
} = authSlice.actions;
export default authSlice.reducer;
