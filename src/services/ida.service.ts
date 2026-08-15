import type {
  IdaApplicantPrefill,
  IdaDisasterPrefill,
  IdaDocumentKindId,
  IdaFinancialImpactId,
  IdaHouseholdPrefill,
  IdaHousingDamageId,
  IdaImmediateNeedId,
  IdaInsuranceTypeId,
  IdaLivingSituationId,
  IdaMissingFieldId,
  IdaSafeToLiveId,
} from '@/constants/ida';
import { apiRequest } from '@/services/api/client';
import type { LocalMediaAsset } from '@/services/disasterSurvey.service';

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: 'image' | 'video' | 'raw';
};

export type IdaMediaRef = {
  url: string;
  fileName: string;
  mimeType?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw';
};

export type IdaDocumentRef = IdaMediaRef & {
  kind: IdaDocumentKindId;
};

export type IdaInvitation = {
  invitationId: string;
  campaignId: string;
  status: 'pending' | 'opened' | 'submitted' | 'needs_info';
  campaign: {
    title: string;
    description: string;
    dispatchedAt?: string;
    disasterType?: string;
    disasterDate?: string;
  };
  prefill: {
    applicant: IdaApplicantPrefill;
    household: IdaHouseholdPrefill;
    disaster: IdaDisasterPrefill;
  };
  applicationId?: string;
  requestedMissingFields?: IdaMissingFieldId[];
  existingDocuments?: Array<{ kind: string; fileName: string; url: string }>;
  existingInsuranceCompany?: string;
  existingCurrentLocation?: string;
};

export type IdaSubmitBody = {
  invitationId: string;
  applicant?: Partial<IdaApplicantPrefill>;
  household?: Partial<IdaHouseholdPrefill>;
  didEvacuate?: boolean | null;
  currentLocation?: string;
  homeAccessible?: boolean | null;
  housingDamage: IdaHousingDamageId;
  safeToLive: IdaSafeToLiveId;
  livingSituation: IdaLivingSituationId;
  livingSituationOther?: string;
  immediateNeeds: IdaImmediateNeedId[];
  immediateNeedsOther?: string;
  insuranceTypes: IdaInsuranceTypeId[];
  insuranceCompany?: string;
  contactedInsurance?: boolean | null;
  financialImpact: IdaFinancialImpactId;
  documents?: IdaDocumentRef[];
  lat?: number;
  lng?: number;
};

export type IdaLocalDocument = LocalMediaAsset & {
  kind: IdaDocumentKindId;
};

/** Damage photos: up to 5. Other document kinds: up to 2 each. */
export const IDA_MAX_DAMAGE_PHOTOS = 5;
export const IDA_MAX_DOCS_PER_KIND = 2;
export const IDA_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const idaService = {
  async getActive(token: string): Promise<{ invitation: IdaInvitation | null }> {
    return apiRequest('/ida/active', { token });
  },

  async markOpened(token: string, invitationId: string): Promise<void> {
    await apiRequest('/ida/open', {
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
    kind: 'picture' | 'video' | 'document',
    file: LocalMediaAsset,
  ): Promise<IdaMediaRef> {
    const signature = await apiRequest<CloudinarySignature>('/ida/media/signature', {
      method: 'POST',
      token,
      body: { kind },
    });

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
        data.error?.message || `Could not upload ${kind} (${response.status})`,
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
    body: IdaSubmitBody,
  ): Promise<{
    message: string;
    claimNumber: string;
    applicationId: string;
    submittedAt: string;
  }> {
    return apiRequest('/ida/applications', {
      method: 'POST',
      token,
      body,
    });
  },

  async supplement(
    token: string,
    body: {
      invitationId: string;
      documents?: IdaDocumentRef[];
      insuranceCompany?: string;
      currentLocation?: string;
    },
  ): Promise<{
    message: string;
    remainingMissingFields?: IdaMissingFieldId[];
    completed?: boolean;
  }> {
    return apiRequest('/ida/applications/supplement', {
      method: 'POST',
      token,
      body,
    });
  },
};
