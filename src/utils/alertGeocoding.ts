import { ENV } from '@/constants/env';
import type { AlertCoordinates } from '@/utils/alertCoordinates';
import { isValidAlertCoordinatePair } from '@/utils/alertCoordinates';

const geocodeCache = new Map<string, AlertCoordinates | null>();

function cacheKey(location: string): string {
  return location.trim().toUpperCase();
}

/** Forward-geocode an alert location label (e.g. river gauge name + state). */
export async function geocodeAlertLocation(location: string): Promise<AlertCoordinates | null> {
  const trimmed = location.trim();
  if (!trimmed) return null;

  const key = cacheKey(trimmed);
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key) ?? null;
  }

  const apiKey = ENV.GEOAPIFY_API_KEY.trim();
  if (!apiKey) {
    geocodeCache.set(key, null);
    return null;
  }

  try {
    const url =
      'https://api.geoapify.com/v1/geocode/search?' +
      `text=${encodeURIComponent(trimmed)}&filter=countrycode:us&limit=1&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as {
      features?: Array<{ geometry?: { coordinates?: number[] } }>;
    };

    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!coords || coords.length < 2) {
      geocodeCache.set(key, null);
      return null;
    }

    const lng = coords[0];
    const lat = coords[1];
    if (!isValidAlertCoordinatePair(lat, lng)) {
      geocodeCache.set(key, null);
      return null;
    }

    const resolved = { lat: Number(lat), lng: Number(lng) };
    geocodeCache.set(key, resolved);
    return resolved;
  } catch {
    geocodeCache.set(key, null);
    return null;
  }
}
