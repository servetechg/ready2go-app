import type { CitizenReportCategoryId } from '@/constants/citizenActivity';
import { apiRequest } from '@/services/api/client';
import type { LocalMediaAsset } from '@/services/disasterSurvey.service';

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: 'image' | 'video';
};

export type CitizenActivityMediaRef = {
  url: string;
  fileName: string;
  mimeType?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw';
};

export type CitizenActivityItem = {
  id: string;
  category: string;
  title: string;
  line1: string;
  line2?: string;
  location?: string;
  timestamp: string;
  displayTime: string;
  priority: string;
  status?: string;
  resolutionStatus?: 'pending' | 'completed';
  pictures?: CitizenActivityMediaRef[];
  videos?: CitizenActivityMediaRef[];
};

export type CitizenActivityMissingField = 'details' | 'pictures' | 'videos';

export type CitizenActivityPendingSupplement = {
  activityId: string;
  title: string;
  description: string;
  details: string;
  category: string;
  requestedMissingFields: CitizenActivityMissingField[];
  existingPictures: CitizenActivityMediaRef[];
  existingVideos: CitizenActivityMediaRef[];
  missingInfoRequestedAt?: string | null;
};

export const CITIZEN_ACTIVITY_MAX_PICTURES = 5;
export const CITIZEN_ACTIVITY_MAX_VIDEOS = 5;
export const CITIZEN_ACTIVITY_PICTURE_MAX_BYTES = 10 * 1024 * 1024;
export const CITIZEN_ACTIVITY_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export const citizenActivityService = {
  async submitSafeCheckIn(
    token: string,
    body: { isSafe: boolean; message?: string },
  ): Promise<{ message: string; item: CitizenActivityItem }> {
    return apiRequest('/citizen-activity', {
      method: 'POST',
      token,
      body: { action: 'safe_checkin', ...body },
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
  ): Promise<CitizenActivityMediaRef> {
    const signature = await apiRequest<CloudinarySignature>(
      '/citizen-activity/media/signature',
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

  async submitReport(
    token: string,
    body: {
      category: CitizenReportCategoryId;
      description: string;
      details?: string;
      lat?: number;
      lng?: number;
      location?: string;
      pictures?: CitizenActivityMediaRef[];
      videos?: CitizenActivityMediaRef[];
    },
  ): Promise<{ message: string; item: CitizenActivityItem }> {
    return apiRequest('/citizen-activity', {
      method: 'POST',
      token,
      body: { action: 'report', ...body },
    });
  },

  async getHistory(token: string): Promise<{ items: CitizenActivityItem[] }> {
    return apiRequest('/citizen-activity?limit=20', { token });
  },

  async getPendingSupplement(
    token: string,
  ): Promise<{ pending: CitizenActivityPendingSupplement | null }> {
    return apiRequest('/citizen-activity/pending-supplement', { token });
  },

  async supplement(
    token: string,
    body: {
      activityId: string;
      details?: string;
      pictures?: CitizenActivityMediaRef[];
      videos?: CitizenActivityMediaRef[];
    },
  ): Promise<{
    message: string;
    activityId: string;
    remainingMissingFields: CitizenActivityMissingField[];
    completed: boolean;
  }> {
    return apiRequest('/citizen-activity/supplement', {
      method: 'POST',
      token,
      body,
    });
  },
};
