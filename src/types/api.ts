import type { AddressData, YesNoStepData } from '@/types/registration';

/** API error body from `/api/v1` */
export interface ApiErrorBody {
  message: string;
  code?: string;
  errors?: { field: string; message: string }[];
}

export type OtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  profileComplete: boolean;
}

/** Raw auth payload from the backend */
export interface ApiAuthResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken?: string;
}

export interface ApiRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface OtpSendResponse {
  message: string;
  expiresInSeconds: number;
}

export interface PasswordResetOtpResponse {
  resetToken: string;
  expiresInSeconds: number;
}

export interface MessageResponse {
  message: string;
}

export interface LodgingProfileData {
  selectedOptions: string[];
  otherDetails?: string;
}

/** Body for `POST /profile/complete` */
export interface ProfilePayload {
  address: AddressData;
  householdSize: number;
  ada: YesNoStepData;
  medical: YesNoStepData;
  pets: YesNoStepData;
  transport: YesNoStepData;
  lodging: LodgingProfileData;
}

export interface ProfileCompleteRequest {
  profile: ProfilePayload;
}

export interface MeResponse {
  user: ApiUser;
  profile: ProfilePayload | null;
}

export interface ProfileCompleteResponse {
  message: string;
  user: ApiUser;
  profile: ProfilePayload;
}
