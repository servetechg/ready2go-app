import { apiRequest } from '@/services/api/client';
import type {
  ApiAuthResponse,
  ApiRefreshResponse,
  MessageResponse,
  OtpPurpose,
  OtpSendResponse,
  PasswordResetOtpResponse,
} from '@/types/api';
import type {
  AuthResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginCredentials,
  ResetPasswordPayload,
  SendOtpPayload,
  SignupApiPayload,
  VerifyOtpPayload,
} from '@/types/auth';
import { asTokenString } from '@/utils/authSessionStorage';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Pull a JWT string out of flat or nested API fields.
 * Backend may send `accessToken` as a string OR `{ token: "..." }`.
 */
function pickToken(
  sources: Array<Record<string, unknown> | null | undefined>,
  keys: string[],
): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const found = asTokenString(source[key]);
      if (found) return found;
    }
  }
  return undefined;
}

/** Accepts flat, nested `data`, nested `tokens`, or object-wrapped token fields. */
function normalizeAuthResponse(raw: ApiAuthResponse & Record<string, unknown>): AuthResponse {
  const root = asRecord(raw) ?? {};
  const data = asRecord(root.data) ?? root;
  const tokens = asRecord(data.tokens);

  const access =
    pickToken([tokens, data, root], ['accessToken', 'access_token', 'token']) || '';
  const refresh = pickToken([tokens, data, root], ['refreshToken', 'refresh_token']);

  const user =
    (asRecord(data.user) as AuthResponse['user'] | null) ||
    (asRecord(root.user) as AuthResponse['user'] | null) ||
    raw.user;

  if (__DEV__) {
    console.log('[auth] normalize keys', {
      hasAccess: Boolean(access),
      hasRefresh: Boolean(refresh),
      accessType: typeof (root.accessToken ?? data.accessToken),
      refreshType: typeof (root.refreshToken ?? data.refreshToken),
      topKeys: Object.keys(root),
    });
  }

  return {
    user,
    token: access,
    refreshToken: refresh,
  };
}

export const authService = {
  async signup(payload: SignupApiPayload): Promise<AuthResponse> {
    const raw = await apiRequest<ApiAuthResponse & { user?: AuthResponse['user']; message?: string }>(
      '/auth/signup',
      {
        method: 'POST',
        body: payload,
      },
    );
    const normalized = normalizeAuthResponse(raw);
    // Signup no longer returns live tokens — only the unverified user for OTP.
    if (!normalized.user) {
      throw new Error('Signup succeeded but user payload was missing');
    }
    return {
      user: normalized.user,
      token: normalized.token || '',
      refreshToken: normalized.refreshToken,
    };
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const raw = await apiRequest<ApiAuthResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    return normalizeAuthResponse(raw);
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    return apiRequest<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: payload,
    });
  },

  async sendOtp(payload: SendOtpPayload): Promise<OtpSendResponse> {
    return apiRequest<OtpSendResponse>('/auth/otp/send', {
      method: 'POST',
      body: payload,
    });
  },

  async verifyOtp(
    payload: VerifyOtpPayload,
    accessToken?: string | null,
  ): Promise<AuthResponse | PasswordResetOtpResponse> {
    if (payload.purpose === 'PASSWORD_RESET') {
      return apiRequest<PasswordResetOtpResponse>('/auth/otp/verify', {
        method: 'POST',
        body: payload,
      });
    }

    const raw = await apiRequest<ApiAuthResponse>('/auth/otp/verify', {
      method: 'POST',
      body: payload,
      token: accessToken,
    });
    return normalizeAuthResponse(raw);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const { resetToken, password, confirmPassword } = payload;
    return apiRequest<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: { resetToken, password, confirmPassword },
    });
  },

  async changePassword(
    payload: ChangePasswordPayload,
    token: string,
  ): Promise<MessageResponse> {
    const { currentPassword, newPassword, confirmPassword } = payload;
    return apiRequest<MessageResponse>('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword, confirmPassword },
      token,
    });
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const raw = await apiRequest<ApiRefreshResponse & Record<string, unknown>>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    const normalized = normalizeAuthResponse({
      ...(raw as ApiAuthResponse & Record<string, unknown>),
      user: null as never,
    });
    const nextRefresh = normalized.refreshToken || asTokenString(refreshToken) || undefined;
    return {
      user: null as never,
      token: normalized.token,
      refreshToken: nextRefresh,
    };
  },

  async logout(token: string, refreshToken?: string | null): Promise<MessageResponse> {
    return apiRequest<MessageResponse>('/auth/logout', {
      method: 'POST',
      body: refreshToken ? { refreshToken } : {},
      token,
    });
  },
};

export type { OtpPurpose };
