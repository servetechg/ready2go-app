import { ENV } from '@/constants/env';
import type { ParsedPlaceAddress } from '@/utils/googlePlaces';
import { parseGoogleAddressComponents } from '@/utils/googlePlaces';

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export interface PlacePrediction {
  placeId: string;
  description: string;
}

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
