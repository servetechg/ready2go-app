import { apiRequest } from '@/services/api/client';
import type { DisasterImmediateNeedId } from '@/constants/disasterSurvey';

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: 'image' | 'video';
};

export type DisasterSurveyMediaRef = {
  url: string;
  fileName: string;
  mimeType?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw';
};

export type DisasterSurveyMissingField =
  | 'comments'
  | 'incident_pictures'
  | 'incident_videos';

export type DisasterSurveyInvitation = {
  invitationId: string;
  campaignId: string;
  status: 'pending' | 'opened' | 'submitted' | 'needs_info';
  campaign: {
    title: string;
    description: string;
    dispatchedAt?: string;
  };
  responseId?: string;
  requestedMissingFields?: DisasterSurveyMissingField[];
  existingImmediateNeeds?: DisasterImmediateNeedId[];
  existingComments?: string;
  existingPictures?: DisasterSurveyMediaRef[];
  existingVideos?: DisasterSurveyMediaRef[];
};

export type LocalMediaAsset = {
  uri: string;
  mimeType: string;
  name: string;
  fileSize?: number;
};

export const DISASTER_SURVEY_MAX_PICTURES = 3;
export const DISASTER_SURVEY_MAX_VIDEOS = 1;
export const DISASTER_SURVEY_PICTURE_MAX_BYTES = 10 * 1024 * 1024;
export const DISASTER_SURVEY_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

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

  /**
   * Uploads straight to Cloudinary with a server-issued signature. Routing the
   * file through our API would hit the serverless ~4.5MB request body limit.
   */
  async uploadMedia(
    token: string,
    kind: 'picture' | 'video',
    file: LocalMediaAsset,
  ): Promise<DisasterSurveyMediaRef> {
    const signature = await apiRequest<CloudinarySignature>(
      '/disaster-survey/media/signature',
      { method: 'POST', token, body: { kind } },
    );

    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('signature', signature.signature);
    form.append('folder', signature.folder);

    const endpoint = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`;
    const response = await fetch(endpoint, { method: 'POST', body: form });
    const data = (await response.json().catch(() => ({}))) as {
      secure_url?: string;
      public_id?: string;
      error?: { message?: string };
    };

    if (!response.ok || !data.secure_url || !data.public_id) {
      throw new Error(
        data.error?.message ||
          `Could not upload ${kind === 'video' ? 'video' : 'picture'} (${response.status})`,
      );
    }

    return {
      url: data.secure_url,
      fileName: file.name,
      mimeType: file.mimeType,
      publicId: data.public_id,
      resourceType: signature.resourceType,
    };
  },

  async submit(
    token: string,
    body: {
      invitationId: string;
      immediateNeeds: DisasterImmediateNeedId[];
      comments?: string;
      incidentPictures?: DisasterSurveyMediaRef[];
      incidentVideos?: DisasterSurveyMediaRef[];
    },
  ): Promise<{ message: string; responseId: string; submittedAt: string }> {
    return apiRequest('/disaster-survey/responses', {
      method: 'POST',
      token,
      body,
    });
  },

  async supplement(
    token: string,
    body: {
      invitationId: string;
      comments?: string;
      incidentPictures?: DisasterSurveyMediaRef[];
      incidentVideos?: DisasterSurveyMediaRef[];
    },
  ): Promise<{
    message: string;
    responseId: string;
    remainingMissingFields: DisasterSurveyMissingField[];
    completed: boolean;
  }> {
    return apiRequest('/disaster-survey/responses/supplement', {
      method: 'POST',
      token,
      body,
    });
  },
};
