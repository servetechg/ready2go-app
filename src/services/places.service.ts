import { ENV } from '@/constants/env';
import type { ParsedPlaceAddress } from '@/utils/googlePlaces';
import {
  fetchPlaceDetails,
  fetchPlaceSuggestions,
  getCachedGeoapifyProperties,
  parseGeoapifyFeatureToPlaceAddress,
  type ParsedAddress,
  type PlaceSuggestion,
} from '@/utils/googlePlaces';

export interface PlacePrediction {
  placeId: string;
  description: string;
}

export type PlaceSearchResult = {
  suggestions: PlaceSuggestion[];
  error?: string;
  source?: 'proxy' | 'geoapify' | 'google';
};

function getApiKey(): string {
  return ENV.GEOAPIFY_API_KEY.trim() || ENV.GOOGLE_MAPS_API_KEY.trim();
}

export function isPlacesSearchAvailable(): boolean {
  return getApiKey().length > 0;
}

export async function fetchPlacePredictions(input: string): Promise<PlacePrediction[]> {
  const key = getApiKey();
  const query = input.trim();
  if (!key || query.length < 2) return [];

  const result = await fetchPlaceSuggestions(query, key);
  return result.suggestions.map((s) => ({
    placeId: s.place_id,
    description: s.description,
  }));
}

export async function fetchPlaceAddress(placeId: string): Promise<ParsedPlaceAddress> {
  const key = getApiKey();
  if (!key) throw new Error('API key is not configured');

  const cached = getCachedGeoapifyProperties(placeId);
  if (cached) {
    const parsed = parseGeoapifyFeatureToPlaceAddress(cached);
    if (!parsed.city && !parsed.state) {
      throw new Error('Could not determine city and state for this place');
    }
    return parsed;
  }

  const details = await fetchPlaceDetails(placeId, key);
  if (!details) {
    throw new Error('Place details lookup failed');
  }

  const parsed: ParsedPlaceAddress = {
    streetAddress: details.streetAddress,
    city: details.city,
    state: details.state,
    zipCode: details.zipCode,
    formattedAddress: `${details.streetAddress ? details.streetAddress + ', ' : ''}${details.city}, ${details.state} ${details.zipCode}`.trim(),
  };

  if (!parsed.city && !parsed.state) {
    throw new Error('Could not determine city and state for this place');
  }

  return parsed;
}

export async function searchPlaces(input: string): Promise<PlaceSearchResult> {
  const trimmed = input.trim();
  if (trimmed.length < 2) {
    return { suggestions: [] };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      suggestions: [],
      error: 'API key missing. Add EXPO_PUBLIC_GEOAPIFY_API_KEY to .env',
    };
  }

  const result = await fetchPlaceSuggestions(trimmed, apiKey);
  if (result.error) {
    return {
      suggestions: [],
      error: result.error,
    };
  }

  return result;
}

export async function resolvePlaceSelection(
  placeId: string,
  apiKey?: string,
): Promise<ParsedAddress | null> {
  const key = apiKey || getApiKey();
  if (!key) return null;
  return fetchPlaceDetails(placeId, key);
}

export { fetchPlaceDetails, reverseGeocode } from '@/utils/googlePlaces';
