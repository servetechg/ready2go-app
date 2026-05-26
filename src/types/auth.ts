import type { ApiUser, OtpPurpose } from '@/types/api';

export type User = ApiUser;

/** Normalized auth result used in Redux (maps API `accessToken` → `token`). */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingAuth: AuthResponse | null;
  otpEmail: string | null;
  pendingPasswordResetEmail: string | null;
  passwordResetToken: string | null;
  passwordResetVerified: boolean;
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

export interface SendOtpPayload {
  email: string;
  purpose: OtpPurpose;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupApiPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignupCredentials extends SignupApiPayload {
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginRejectedPayload {
  message: string;
  code?: string;
  email?: string;
}
