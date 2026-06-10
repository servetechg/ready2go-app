import { apiRequest } from '@/services/api/client';
import type { IncidentLogEntry, MapMarkerPoint, MapPolygonOverlay } from '@/types/emergency';
import { normalizeMapMarkers } from '@/utils/mapLayers';

export type EmergencyMapResponse = {
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  mapMarkers: MapMarkerPoint[];
  mapOverlays?: MapPolygonOverlay[];
};

export async function fetchEmergencyMap(token: string): Promise<EmergencyMapResponse> {
  const response = await apiRequest<EmergencyMapResponse>('/emergency/map', { token });
  return {
    ...response,
    mapMarkers: normalizeMapMarkers(response.mapMarkers ?? []),
    mapOverlays: response.mapOverlays ?? [],
  };
}

export async function fetchEmergencyIncidents(token: string): Promise<IncidentLogEntry[]> {
  const response = await apiRequest<{ incidents: IncidentLogEntry[] } | IncidentLogEntry[]>(
    '/emergency/incidents',
    { token },
  );
  return Array.isArray(response) ? response : response.incidents;
}
