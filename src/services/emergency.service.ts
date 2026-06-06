import { apiRequest } from '@/services/api/client';
import type { IncidentLogEntry, MapMarkerPoint } from '@/types/emergency';

export type EmergencyMapResponse = {
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  mapMarkers: MapMarkerPoint[];
};

export async function fetchEmergencyMap(token: string): Promise<EmergencyMapResponse> {
  return apiRequest<EmergencyMapResponse>('/emergency/map', { token });
}

export async function fetchEmergencyIncidents(token: string): Promise<IncidentLogEntry[]> {
  const response = await apiRequest<{ incidents: IncidentLogEntry[] } | IncidentLogEntry[]>(
    '/emergency/incidents',
    { token },
  );
  return Array.isArray(response) ? response : response.incidents;
}
