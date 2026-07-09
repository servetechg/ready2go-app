import { apiRequest } from '@/services/api/client';
import type { EmergencyNewsResponse, IncidentLogEntry } from '@/types/emergency';
import { mapHomeNewsToEmergencyNewsItem } from '@/utils/dashboardMappers';
import type { DashboardHomeNewsItem } from '@/types/dashboard';
import { adaptEmergencyMapResponse } from '@/utils/emergencyMapAdapter';
import { normalizeMapMarkers } from '@/utils/mapLayers';

export type EmergencyNewsQuery = {
  page?: number;
  limit?: number;
  category?: string;
};

export async function fetchEmergencyNews(
  token: string,
  query: EmergencyNewsQuery = {},
): Promise<EmergencyNewsResponse> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 20),
  });
  if (query.category?.trim()) params.set('category', query.category.trim());

  const response = await apiRequest<{
    items: DashboardHomeNewsItem[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    stateCode?: string | null;
  }>(`/emergency/news?${params}`, { token });

  return {
    ...response,
    items: (response.items ?? []).map(mapHomeNewsToEmergencyNewsItem),
  };
}

export type EmergencyMapResponse = ReturnType<typeof adaptEmergencyMapResponse> & {
  mapRegion: NonNullable<ReturnType<typeof adaptEmergencyMapResponse>['mapRegion']>;
};

export async function fetchEmergencyMap(token: string): Promise<EmergencyMapResponse> {
  const response = await apiRequest<Parameters<typeof adaptEmergencyMapResponse>[0]>('/emergency/map', {
    token,
  });
  const adapted = adaptEmergencyMapResponse(response);
  if (!adapted.mapRegion) {
    throw new Error('Map region missing from API response');
  }
  return {
    ...adapted,
    mapRegion: adapted.mapRegion,
    mapMarkers: normalizeMapMarkers(adapted.mapMarkers),
    mapOverlays: adapted.mapOverlays,
  };
}

type RawIncident = {
  id?: string;
  title?: string;
  description?: string;
  message?: string;
  location?: string;
  reportedAt?: string;
  timestamp?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

function adaptIncident(entry: RawIncident): IncidentLogEntry | null {
  const message = entry.message ?? entry.description ?? entry.title;
  const timestamp = entry.timestamp ?? entry.reportedAt;
  if (!message || !timestamp) return null;
  return {
    id: String(entry.id ?? timestamp),
    message: String(message),
    timestamp: String(timestamp),
    latitude: entry.latitude ?? entry.lat,
    longitude: entry.longitude ?? entry.lng,
  };
}

export async function fetchEmergencyIncidents(token: string): Promise<IncidentLogEntry[]> {
  const response = await apiRequest<
    { items?: RawIncident[]; incidents?: RawIncident[] } | RawIncident[]
  >('/emergency/incidents', { token });
  const raw = Array.isArray(response) ? response : (response.items ?? response.incidents ?? []);
  return raw.map(adaptIncident).filter((entry): entry is IncidentLogEntry => entry !== null);
}
