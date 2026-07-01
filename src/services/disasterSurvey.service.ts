import { apiRequest } from '@/services/api/client';
import type { DisasterImmediateNeedId } from '@/constants/disasterSurvey';

export type DisasterSurveyInvitation = {
  invitationId: string;
  campaignId: string;
  status: 'pending' | 'opened' | 'submitted';
  campaign: {
    title: string;
    description: string;
    dispatchedAt?: string;
  };
};

export const disasterSurveyService = {
  async getActive(token: string): Promise<{ invitation: DisasterSurveyInvitation | null }> {
    return apiRequest('/disaster-survey/active', { token });
  },

  async markOpened(token: string, invitationId: string): Promise<void> {
    await apiRequest('/disaster-survey/open', {
      method: 'POST',
      token,
      body: { invitationId },
    });
  },

  async submit(
    token: string,
    body: {
      invitationId: string;
      immediateNeeds: DisasterImmediateNeedId[];
    },
  ): Promise<{ message: string; responseId: string; submittedAt: string }> {
    return apiRequest('/disaster-survey/responses', {
      method: 'POST',
      token,
      body,
    });
  },
};
