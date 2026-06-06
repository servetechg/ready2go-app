import { ENV } from '@/constants/env';
import type { ParsedPlaceAddress } from '@/utils/googlePlaces';
import {
  fetchPlaceDetails,
  fetchPlaceSuggestions,
  parseGoogleAddressComponents,
  type ParsedAddress,
  type PlaceSuggestion,
} from '@/utils/googlePlaces';
import { formatGooglePlacesError, isGoogleMapsKeyConfigured } from '@/utils/googlePlacesErrors';

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export interface PlacePrediction {
  placeId: string;
  description: string;
}

export type PlaceSearchResult = {
  suggestions: PlaceSuggestion[];
  error?: string;
  source?: 'proxy' | 'google';
};

function getApiKey(): string {
  return ENV.GOOGLE_MAPS_API_KEY.trim();
}

export function isPlacesSearchAvailable(): boolean {
  return getApiKey().length > 0;
}

export async function fetchPlacePredictions(input: string): Promise<PlacePrediction[]> {
  const key = getApiKey();
  const query = input.trim();
  if (!key || query.length < 2) return [];

  const params = new URLSearchParams({
    input: query,
    key,
    components: 'country:us',
    types: 'geocode',
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
  );
  const data = (await response.json()) as {
    status: string;
    predictions?: { place_id: string; description: string }[];
    error_message?: string;
  };

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.error_message ?? `Places search failed (${data.status})`);
  }

  return (data.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
  }));
}

export async function fetchPlaceAddress(placeId: string): Promise<ParsedPlaceAddress> {
  const key = getApiKey();
  if (!key) throw new Error('Google Maps API key is not configured');

  const params = new URLSearchParams({
    place_id: placeId,
    key,
    fields: 'address_component,formatted_address',
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
  );
  const data = (await response.json()) as {
    status: string;
    result?: {
      formatted_address?: string;
      address_components?: GoogleAddressComponent[];
    };
    error_message?: string;
  };

  if (data.status !== 'OK' || !data.result) {
    throw new Error(data.error_message ?? `Place details failed (${data.status})`);
  }

  const parsed = parseGoogleAddressComponents(
    data.result.address_components ?? [],
    data.result.formatted_address ?? '',
  );

  if (!parsed.city && !parsed.state) {
    throw new Error('Could not determine city and state for this place');
  }

  return parsed;
}

/** Web app origin derived from EXPO_PUBLIC_API_BASE_URL (strip /api/v1). */
function getWebOrigin(): string | null {
  const base = ENV.API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  if (!base) return null;
  if (!__DEV__ && base.includes('localhost')) return null;
  return base;
}

/**
 * Try the Next.js web API proxy first (same key as web, server-side — no referrer issue).
 * Falls back to direct Google REST with EXPO_PUBLIC / native-configured mobile key.
 */
export async function searchPlaces(input: string): Promise<PlaceSearchResult> {
  const trimmed = input.trim();
  if (trimmed.length < 2) {
    return { suggestions: [] };
  }

  const proxyUrl = process.env.EXPO_PUBLIC_PLACES_AUTOCOMPLETE_URL;
  const origin = getWebOrigin();

  const proxyCandidates = [
    proxyUrl,
    origin ? `${origin}/api/places/autocomplete?input=${encodeURIComponent(trimmed)}` : null,
    origin ? `${origin}/api/google/places/autocomplete?input=${encodeURIComponent(trimmed)}` : null,
  ].filter(Boolean) as string[];

  for (const url of proxyCandidates) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) continue;

      const data = (await response.json()) as {
        predictions?: PlaceSuggestion[];
        suggestions?: PlaceSuggestion[];
        status?: string;
        error_message?: string;
      };

      const list = data.predictions ?? data.suggestions;
      if (Array.isArray(list)) {
        return { suggestions: list, source: 'proxy' };
      }
      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        continue;
      }
    } catch {
      // try next candidate
    }
  }

  const apiKey = ENV.GOOGLE_MAPS_API_KEY;
  if (!isGoogleMapsKeyConfigured(apiKey)) {
    return {
      suggestions: [],
      error:
        'Google Maps API key missing. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env (mobile key, not website-only), then run: npx expo start -c',
    };
  }

  const result = await fetchPlaceSuggestions(trimmed, apiKey);
  if (result.error) {
    return {
      suggestions: [],
      error: formatGooglePlacesError('ERROR', result.error),
      source: 'google',
    };
  }

  return { ...result, source: 'google' };
}

export async function resolvePlaceSelection(
  placeId: string,
  apiKey?: string,
): Promise<ParsedAddress | null> {
  const key = apiKey ?? ENV.GOOGLE_MAPS_API_KEY;
  if (!isGoogleMapsKeyConfigured(key)) return null;
  return fetchPlaceDetails(placeId, key);
}

export { fetchPlaceDetails, reverseGeocode } from '@/utils/googlePlaces';
