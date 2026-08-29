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

export type GeoapifyProperties = {
  place_id?: string;
  name?: string;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  lat?: number;
  lon?: number;
};

export type GeoapifyFeature = {
  type: string;
  properties: GeoapifyProperties;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
};

export type GeoapifyResponse = {
  type: string;
  features?: GeoapifyFeature[];
  message?: string;
};

const geoapifyCache = new Map<string, GeoapifyProperties>();

export function getCachedGeoapifyProperties(placeId: string): GeoapifyProperties | undefined {
  return geoapifyCache.get(placeId);
}

export function parseGeoapifyFeatureProperties(props: GeoapifyProperties): ParsedAddress {
  const latitude = props.lat ?? 0;
  const longitude = props.lon ?? 0;

  const city =
    props.city ||
    props.town ||
    props.village ||
    props.municipality ||
    props.county ||
    props.state ||
    props.name ||
    props.address_line1 ||
    '';

  const state = props.state_code || props.state || '';

  let streetAddress = '';
  if (props.housenumber && props.street) {
    streetAddress = `${props.housenumber} ${props.street}`;
  } else if (props.street) {
    streetAddress = props.street;
  } else if (props.address_line1) {
    const line1Lower = props.address_line1.trim().toLowerCase();
    const cityLower = city.trim().toLowerCase();
    const stateLower = (props.state || '').trim().toLowerCase();
    const nameLower = (props.name || '').trim().toLowerCase();

    if (
      line1Lower !== cityLower &&
      line1Lower !== stateLower &&
      line1Lower !== nameLower
    ) {
      streetAddress = props.address_line1;
    }
  }

  const zipCode =
    props.postcode ||
    (props.address_line1 && /^\d{5}(-\d{4})?$/.test(props.address_line1.trim())
      ? props.address_line1.trim()
      : '');

  return {
    streetAddress: streetAddress.trim(),
    city: city.trim(),
    state: state.trim(),
    zipCode: zipCode.trim(),
    latitude,
    longitude,
  };
}

export function parseGeoapifyFeatureToPlaceAddress(props: GeoapifyProperties): ParsedPlaceAddress {
  const parsed = parseGeoapifyFeatureProperties(props);
  return {
    streetAddress: parsed.streetAddress,
    city: parsed.city,
    state: parsed.state,
    zipCode: parsed.zipCode,
    formattedAddress: props.formatted || '',
  };
}

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

export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<ParsedAddress | null> {
  if (!apiKey || !placeId) return null;

  const cached = geoapifyCache.get(placeId);
  if (cached) {
    return parseGeoapifyFeatureProperties(cached);
  }

  try {
    const url = `https://api.geoapify.com/v2/place-details?id=${encodeURIComponent(placeId)}&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as GeoapifyResponse;

    const feature = data.features?.[0];
    if (!feature?.properties) return null;

    const props = feature.properties;
    if (props.lat === undefined && feature.geometry?.coordinates) {
      props.lon = feature.geometry.coordinates[0];
      props.lat = feature.geometry.coordinates[1];
    }
    geoapifyCache.set(placeId, props);
    return parseGeoapifyFeatureProperties(props);
  } catch {
    return null;
  }
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

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  apiKey: string,
): Promise<ParsedAddress | null> {
  if (!apiKey) return null;

  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as GeoapifyResponse;

    const feature = data.features?.[0];
    if (!feature?.properties) return null;

    const props = feature.properties;
    if (props.lat === undefined && feature.geometry?.coordinates) {
      props.lon = feature.geometry.coordinates[0];
      props.lat = feature.geometry.coordinates[1];
    }
    return parseGeoapifyFeatureProperties(props);
  } catch {
    return null;
  }
}

/** Continental United States overview (not zoomed into Kansas). */
export const DEFAULT_MAP_CENTER = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 25,
  longitudeDelta: 45,
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

export async function fetchPlaceSuggestions(
  input: string,
  apiKey: string,
): Promise<{ suggestions: PlaceSuggestion[]; error?: string }> {
  const trimmed = input.trim();
  if (trimmed.length < 2 || !apiKey) {
    return { suggestions: [] };
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(trimmed)}&filter=countrycode:us&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as GeoapifyResponse;

    if (data.message) {
      return { suggestions: [], error: data.message };
    }

    if (!data.features || data.features.length === 0) {
      return { suggestions: [] };
    }

    const suggestions: PlaceSuggestion[] = data.features.map((feature) => {
      const props = feature.properties;
      if (props.lat === undefined && feature.geometry?.coordinates) {
        props.lon = feature.geometry.coordinates[0];
        props.lat = feature.geometry.coordinates[1];
      }

      const placeId = props.place_id || `${props.lat}_${props.lon}_${Math.random()}`;
      props.place_id = placeId;
      geoapifyCache.set(placeId, props);

      const mainText = props.address_line1 || props.name || props.formatted || '';
      const secondaryText = props.address_line2 || props.country || '';

      return {
        place_id: placeId,
        description: props.formatted || `${mainText}, ${secondaryText}`.replace(/^,\s*|,\s*$/g, ''),
        structured_formatting: {
          main_text: mainText,
          secondary_text: secondaryText,
        },
      };
    });

    return { suggestions };
  } catch (err) {
    return {
      suggestions: [],
      error: err instanceof Error ? err.message : 'Autocomplete request failed',
    };
  }
}
