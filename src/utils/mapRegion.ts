import { DEFAULT_MAP_REGION } from '@/constants/emergency';
import type { AddressData } from '@/types/registration';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const DEFAULT_DELTA = { latitudeDelta: 0.6, longitudeDelta: 0.6 } as const;

export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  const latitude = typeof lat === 'number' ? lat : Number(lat);
  const longitude = typeof lng === 'number' ? lng : Number(lng);
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    (latitude !== 0 || longitude !== 0)
  );
}

function sanitizeDelta(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function sanitizeMapRegion(region: MapRegion, fallback: MapRegion = DEFAULT_MAP_REGION): MapRegion {
  if (!isValidLatLng(region.latitude, region.longitude)) {
    return { ...fallback };
  }

  return {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: sanitizeDelta(region.latitudeDelta, fallback.latitudeDelta),
    longitudeDelta: sanitizeDelta(region.longitudeDelta, fallback.longitudeDelta),
  };
}

/** Prefer API region, then profile address coords, then US default center. */
export function resolveMapRegion(
  apiRegion?: MapRegion | null,
  address?: Pick<AddressData, 'latitude' | 'longitude'>,
): MapRegion {
  if (apiRegion && isValidLatLng(apiRegion.latitude, apiRegion.longitude)) {
    return sanitizeMapRegion(apiRegion);
  }

  const { latitude, longitude } = address ?? {};
  if (isValidLatLng(latitude, longitude)) {
    return {
      latitude: Number(latitude),
      longitude: Number(longitude),
      ...DEFAULT_DELTA,
    };
  }

  return { ...DEFAULT_MAP_REGION };
}

export function isValidMapRegion(region: MapRegion | null | undefined): boolean {
  if (!region) return false;
  if (!isValidLatLng(region.latitude, region.longitude)) return false;
  return (
    Number.isFinite(region.latitudeDelta) &&
    Number.isFinite(region.longitudeDelta) &&
    region.latitudeDelta > 0 &&
    region.longitudeDelta > 0
  );
}

export function calculateRegionForMarkers(
  markers: Array<{ latitude: number; longitude: number }>,
  fallbackRegion: MapRegion,
): MapRegion {
  if (!markers || markers.length === 0) return fallbackRegion;

  const validMarkers = markers
    .map((m) => ({
      latitude: typeof m.latitude === 'number' ? m.latitude : Number(m.latitude),
      longitude: typeof m.longitude === 'number' ? m.longitude : Number(m.longitude),
    }))
    .filter((m) => isValidLatLng(m.latitude, m.longitude));

  if (validMarkers.length === 0) return sanitizeMapRegion(fallbackRegion);

  let minLat = validMarkers[0].latitude;
  let maxLat = validMarkers[0].latitude;
  let minLng = validMarkers[0].longitude;
  let maxLng = validMarkers[0].longitude;

  for (let i = 1; i < validMarkers.length; i++) {
    const m = validMarkers[i];
    if (m.latitude < minLat) minLat = m.latitude;
    if (m.latitude > maxLat) maxLat = m.latitude;
    if (m.longitude < minLng) minLng = m.longitude;
    if (m.longitude > maxLng) maxLng = m.longitude;
  }

  // Use a reasonable minimum delta so it doesn't zoom too far in
  const latDelta = Math.max(maxLat - minLat, 0.4) * 1.2;
  const lngDelta = Math.max(maxLng - minLng, 0.4) * 1.2;

  return sanitizeMapRegion({
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  });
}
