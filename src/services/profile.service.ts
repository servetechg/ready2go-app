import { apiRequest } from '@/services/api/client';
import type { MeResponse, ProfileCompleteRequest, ProfileCompleteResponse } from '@/types/api';

export const profileService = {
  async getMe(token: string): Promise<MeResponse> {
    return apiRequest<MeResponse>('/users/me', { token });
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
};
