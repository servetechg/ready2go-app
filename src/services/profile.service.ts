import { apiFormRequest, apiRequest } from '@/services/api/client';
import type {
  AvatarResponse,
  MeResponse,
  PatchProfileResponse,
  PatchUserRequest,
  PatchUserResponse,
  ProfileCompleteRequest,
  ProfileCompleteResponse,
  ProfileDocumentUploadResponse,
  ProfilePayload,
  PutAlertLocationsResponse,
} from '@/types/api';
import type { AlertLocation } from '@/types/registration';
import { toAlertLocationsRequestBody } from '@/utils/profileApi';

export const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const PROFILE_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export type ProfileDocumentKind = 'ownership' | 'residency';

function appendDocumentForm(
  form: FormData,
  file: { uri: string; mimeType: string; name: string },
) {
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
}

export const profileService = {
  async getMe(token: string): Promise<MeResponse> {
    return apiRequest<MeResponse>('/users/me', { token });
  },

  async patchUser(token: string, body: PatchUserRequest): Promise<PatchUserResponse> {
    return apiRequest<PatchUserResponse>('/users/me', {
      method: 'PATCH',
      body,
      token,
    });
  },

  async patchProfile(
    token: string,
    body: Partial<ProfilePayload>,
  ): Promise<PatchProfileResponse> {
    return apiRequest<PatchProfileResponse>('/profile', {
      method: 'PATCH',
      body,
      token,
    });
  },

  async putAlertLocations(
    token: string,
    alertLocations: AlertLocation[],
  ): Promise<PutAlertLocationsResponse> {
    return apiRequest<PutAlertLocationsResponse>('/profile/alert-locations', {
      method: 'PUT',
      body: { alertLocations: toAlertLocationsRequestBody(alertLocations) },
      token,
    });
  },

  async completeProfile(
    body: ProfileCompleteRequest,
    token: string,
  ): Promise<ProfileCompleteResponse> {
    return apiRequest<ProfileCompleteResponse>('/profile/complete', {
      method: 'POST',
      body,
      token,
    });
  },

  async uploadAvatar(
    token: string,
    file: { uri: string; mimeType: string; name: string },
  ): Promise<AvatarResponse> {
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);

    return apiFormRequest<AvatarResponse>('/users/me/avatar', form, token);
  },

  async deleteAvatar(token: string): Promise<AvatarResponse> {
    return apiRequest<AvatarResponse>('/users/me/avatar', {
      method: 'DELETE',
      token,
    });
  },

  async uploadProfileDocument(
    token: string,
    kind: ProfileDocumentKind,
    file: { uri: string; mimeType: string; name: string },
  ): Promise<ProfileDocumentUploadResponse> {
    const form = new FormData();
    appendDocumentForm(form, file);
    return apiFormRequest<ProfileDocumentUploadResponse>(
      `/profile/documents/${kind}`,
      form,
      token,
    );
  },

  async deleteProfileDocument(
    token: string,
    kind: ProfileDocumentKind,
  ): Promise<ProfileDocumentUploadResponse> {
    return apiRequest<ProfileDocumentUploadResponse>(`/profile/documents/${kind}`, {
      method: 'DELETE',
      token,
    });
  },

  async registerPushToken(token: string, expoPushToken: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/users/me/push-token', {
      method: 'PUT',
      body: { expoPushToken },
      token,
    });
  },

  async clearPushToken(token: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/users/me/push-token', {
      method: 'DELETE',
      token,
    });
  },

  async updatePassword(
    token: string,
    body: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/users/update-password', {
      method: 'POST',
      body,
      token,
    });
  },
};
