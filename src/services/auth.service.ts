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

function normalizeAuthResponse(raw: ApiAuthResponse): AuthResponse {
  return {
    user: raw.user,
    token: raw.accessToken,
    refreshToken: raw.refreshToken,
  };
}

export const authService = {
  async signup(payload: SignupApiPayload): Promise<AuthResponse> {
    const raw = await apiRequest<ApiAuthResponse>('/auth/signup', {
      method: 'POST',
      body: payload,
    });
    return normalizeAuthResponse(raw);
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
    const raw = await apiRequest<ApiRefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    return {
      user: null as never,
      token: raw.accessToken,
      refreshToken: raw.refreshToken,
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
