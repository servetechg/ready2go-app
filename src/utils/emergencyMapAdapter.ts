import type { GisMapLayerId, MapMarkerPoint, MapPolygonOverlay } from '@/types/emergency';

type RawMapMarker = {
  id?: string;
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  layer?: GisMapLayerId;
  severity?: string;
  type?: MapMarkerPoint['type'];
};

type RawMapOverlay = {
  id?: string;
  layer?: MapPolygonOverlay['layer'];
  coordinates?: Array<{ latitude?: number; longitude?: number; lat?: number; lng?: number }>;
  fillColor?: string;
  strokeColor?: string;
};

type RawMapResponse = {
  mapRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  mapMarkers?: RawMapMarker[];
  mapOverlays?: RawMapOverlay[];
  markers?: RawMapMarker[];
};

export function adaptEmergencyMapMarkers(raw: RawMapMarker[] | undefined): MapMarkerPoint[] {
  if (!Array.isArray(raw)) return [];

  const markers: MapMarkerPoint[] = [];

  for (const marker of raw) {
    const latitude = marker.latitude ?? marker.lat;
    const longitude = marker.longitude ?? marker.lng;
    if (
      latitude == null ||
      longitude == null ||
      Number.isNaN(Number(latitude)) ||
      Number.isNaN(Number(longitude))
    ) {
      continue;
    }

    markers.push({
      id: String(marker.id ?? `${latitude}-${longitude}`),
      title: String(marker.title ?? 'Point'),
      description: marker.description ? String(marker.description) : undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      layer: marker.layer,
      severity: marker.severity ? String(marker.severity) : undefined,
      type: marker.type,
    });
  }

  return markers;
}

export function adaptEmergencyMapOverlays(raw: RawMapOverlay[] | undefined): MapPolygonOverlay[] {
  if (!Array.isArray(raw)) return [];

  const overlays: MapPolygonOverlay[] = [];

  for (const overlay of raw) {
    if (!overlay.layer || !Array.isArray(overlay.coordinates)) continue;

    const coordinates = overlay.coordinates
      .map((point) => {
        const latitude = point.latitude ?? point.lat;
        const longitude = point.longitude ?? point.lng;
        if (latitude == null || longitude == null) return null;
        return { latitude: Number(latitude), longitude: Number(longitude) };
      })
      .filter((point): point is { latitude: number; longitude: number } => point !== null);

    if (coordinates.length < 3) continue;

    overlays.push({
      id: String(overlay.id ?? overlay.layer),
      layer: overlay.layer,
      coordinates,
      fillColor: overlay.fillColor,
      strokeColor: overlay.strokeColor,
    });
  }

  return overlays;
}

export function adaptEmergencyMapResponse(response: RawMapResponse) {
  const mapMarkers = adaptEmergencyMapMarkers(response.mapMarkers ?? response.markers);
  const mapOverlays = adaptEmergencyMapOverlays(response.mapOverlays);

  return {
    mapRegion: response.mapRegion,
    mapMarkers,
    mapOverlays,
  };
}
