export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

/** Used by alert-location autocomplete (city/state/zip). */
export interface ParsedPlaceAddress {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  formattedAddress: string;
}

export type ParsedAddress = {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
};

function getComponent(
  components: GoogleAddressComponent[],
  type: string,
  useShort = false,
): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return '';
  return useShort ? match.short_name : match.long_name;
}

function pickComponent(
  components: GoogleAddressComponent[],
  ...types: string[]
): GoogleAddressComponent | undefined {
  return components.find((c) => types.some((t) => c.types.includes(t)));
}

function buildStreetAddress(
  components: GoogleAddressComponent[],
  formattedAddress?: string,
): string {
  const streetNumber = getComponent(components, 'street_number');
  const route = getComponent(components, 'route');
  const streetAddress = [streetNumber, route].filter(Boolean).join(' ').trim();

  if (streetAddress) return streetAddress;
  if (formattedAddress) {
    return formattedAddress.split(',')[0]?.trim() ?? formattedAddress;
  }
  return '';
}

/** Maps Google `address_components` to alert-location fields (US). */
export function parseGoogleAddressComponents(
  components: GoogleAddressComponent[],
  formattedAddress = '',
): ParsedPlaceAddress {
  const cityComponent =
    pickComponent(components, 'locality') ??
    pickComponent(components, 'postal_town') ??
    pickComponent(components, 'sublocality', 'sublocality_level_1') ??
    pickComponent(components, 'administrative_area_level_2');

  const stateComponent = pickComponent(components, 'administrative_area_level_1');
  const zipComponent = pickComponent(components, 'postal_code');

  return {
    streetAddress: buildStreetAddress(components, formattedAddress),
    city: cityComponent?.long_name ?? '',
    state: stateComponent?.short_name ?? '',
    zipCode: zipComponent?.long_name ?? '',
    formattedAddress,
  };
}

/** Match web signup: locality → city, administrative_area_level_1 → state, postal_code → zip */
export function parseAddressComponents(
  components: GoogleAddressComponent[],
  latitude: number,
  longitude: number,
  formattedAddress?: string,
): ParsedAddress {
  const streetAddress = buildStreetAddress(components, formattedAddress);

  const city =
    getComponent(components, 'locality') ||
    getComponent(components, 'postal_town') ||
    getComponent(components, 'sublocality') ||
    getComponent(components, 'administrative_area_level_2');

  const state = getComponent(components, 'administrative_area_level_1', true);
  const zipCode = getComponent(components, 'postal_code');

  return {
    streetAddress,
    city,
    state,
    zipCode,
    latitude,
    longitude,
  };
}

type PlaceDetailsResult = {
  address_components: GoogleAddressComponent[];
  formatted_address?: string;
  geometry: { location: { lat: number; lng: number } };
};

type PlaceDetailsResponse = {
  status: string;
  result?: PlaceDetailsResult;
};

export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<ParsedAddress | null> {
  if (!apiKey || !placeId) return null;

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}` +
    `&fields=address_components,geometry,formatted_address&key=${apiKey}`;

  const response = await fetch(url);
  const data = (await response.json()) as PlaceDetailsResponse;

  if (data.status !== 'OK' || !data.result?.geometry?.location) {
    return null;
  }

  const { lat, lng } = data.result.geometry.location;
  return parseAddressComponents(
    data.result.address_components ?? [],
    lat,
    lng,
    data.result.formatted_address,
  );
}

export function parsePlaceDetails(
  details: PlaceDetailsResult,
): ParsedAddress | null {
  if (!details.geometry?.location) return null;
  const { lat, lng } = details.geometry.location;
  return parseAddressComponents(
    details.address_components ?? [],
    lat,
    lng,
    details.formatted_address,
  );
}

type GeocodeResponse = {
  status: string;
  results?: Array<{
    address_components: GoogleAddressComponent[];
    formatted_address?: string;
  }>;
};

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  apiKey: string,
): Promise<ParsedAddress | null> {
  if (!apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
  const response = await fetch(url);
  const data = (await response.json()) as GeocodeResponse;

  if (data.status !== 'OK' || !data.results?.[0]) {
    return null;
  }

  return parseAddressComponents(
    data.results[0].address_components,
    latitude,
    longitude,
    data.results[0].formatted_address,
  );
}

export const DEFAULT_MAP_CENTER = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 8,
  longitudeDelta: 8,
} as const;

export const SELECTED_MAP_DELTA = {
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
} as const;

export type PlaceSuggestion = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: Array<{ offset: number; length: number }>;
  };
};

type AutocompleteResponse = {
  status: string;
  predictions?: PlaceSuggestion[];
  error_message?: string;
};

export async function fetchPlaceSuggestions(
  input: string,
  apiKey: string,
): Promise<{ suggestions: PlaceSuggestion[]; error?: string }> {
  const trimmed = input.trim();
  if (trimmed.length < 2 || !apiKey) {
    return { suggestions: [] };
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
    `input=${encodeURIComponent(trimmed)}&key=${apiKey}&components=country:us&language=en`;

  const response = await fetch(url);
  const data = (await response.json()) as AutocompleteResponse;

  if (data.status === 'ZERO_RESULTS') {
    return { suggestions: [] };
  }

  if (data.status !== 'OK') {
    return {
      suggestions: [],
      error: data.error_message ?? data.status,
    };
  }

  return { suggestions: data.predictions ?? [] };
}
