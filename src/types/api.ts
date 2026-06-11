import type { AddressData, AlertLocation, YesNoStepData } from '@/types/registration';
import type { ProfileDocumentRef } from '@/types/profileDocument';

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
  phone?: string;
  profilePic?: string;
  emailVerified: boolean;
  profileComplete: boolean;
  /** ISO timestamp from signup — drives incomplete-profile reminder delay */
  createdAt?: string;
}

export interface AvatarResponse {
  message: string;
  user: ApiUser;
}

/** Body for `PATCH /users/me` — at least one field required. */
export type PatchUserRequest = Partial<
  Pick<ApiUser, 'firstName' | 'lastName' | 'email' | 'phone'>
>;

export interface PatchUserResponse {
  user: ApiUser;
}

export interface PatchProfileResponse {
  message: string;
  profile: ProfilePayload;
}

export interface PutAlertLocationsResponse {
  alertLocations: AlertLocation[];
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

/** Alert location row sent to / received from the API (no street address). */
export interface AlertLocationPayload {
  id?: string;
  label: string;
  city: string;
  state: string;
  zipCode?: string;
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
  isPrimaryAddress?: boolean;
  allowResidenceInspection?: boolean;
  proofOfOwnership?: ProfileDocumentRef | null;
  proofOfResidency?: ProfileDocumentRef | null;
  alertLocations?: AlertLocationPayload[];
}

export interface ProfileDocumentUploadResponse {
  message: string;
  document: ProfileDocumentRef;
  profile?: ProfilePayload;
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
