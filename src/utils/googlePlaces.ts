export interface ParsedPlaceAddress {
  city: string;
  state: string;
  zipCode: string;
  formattedAddress: string;
}

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function pickComponent(components: AddressComponent[], ...types: string[]): AddressComponent | undefined {
  return components.find((c) => types.some((t) => c.types.includes(t)));
}

/** Maps Google `address_components` to alert-location fields (US). */
export function parseGoogleAddressComponents(
  components: AddressComponent[],
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
    city: cityComponent?.long_name ?? '',
    state: stateComponent?.short_name ?? '',
    zipCode: zipComponent?.long_name ?? '',
    formattedAddress,
  };
}
