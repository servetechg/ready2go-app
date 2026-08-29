import { useEffect, useMemo, useState } from 'react';

import type { AddressData } from '@/types/registration';
import type { AlertCoordinates } from '@/utils/alertCoordinates';
import { isValidAlertCoordinatePair } from '@/utils/alertCoordinates';
import { geocodeAlertLocation } from '@/utils/alertGeocoding';
import { formatAddressLine } from '@/utils/formatAddress';

function coordsFromAddress(address: AddressData): AlertCoordinates | null {
  const { latitude, longitude } = address;
  if (isValidAlertCoordinatePair(latitude, longitude)) {
    return { lat: Number(latitude), lng: Number(longitude) };
  }
  return null;
}

/** Registered home coordinates from profile, geocoding the saved address when lat/lng are missing. */
export function useRegisteredHomeCoordinates(address: AddressData) {
  const addressQuery = useMemo(
    () => formatAddressLine(address).trim(),
    [address.streetAddress, address.city, address.state, address.zipCode],
  );

  const explicitCoords = useMemo(
    () => coordsFromAddress(address),
    [address.latitude, address.longitude],
  );

  const [geocoded, setGeocoded] = useState<AlertCoordinates | null>(null);
  const [geocodedQuery, setGeocodedQuery] = useState<string | null>(null);

  useEffect(() => {
    if (!addressQuery || addressQuery === 'Address not set') {
      setGeocoded(null);
      setGeocodedQuery(null);
      return;
    }

    let cancelled = false;
    setGeocoded(null);
    setGeocodedQuery(null);

    void geocodeAlertLocation(addressQuery).then((coords) => {
      if (!cancelled && coords) {
        setGeocoded(coords);
        setGeocodedQuery(addressQuery);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [addressQuery]);

  const geocodedForCurrentAddress =
    geocoded && geocodedQuery === addressQuery ? geocoded : null;

  // Geocoded address text wins over stale saved lat/lng after Edit Profile.
  // Saved lat/lng from AddressPicker is used while geocoding or if geocode fails.
  return geocodedForCurrentAddress ?? explicitCoords;
}

export function separateFromReference(
  coords: AlertCoordinates,
  reference: AlertCoordinates | null,
  minDistance = 0.018,
): AlertCoordinates {
  if (!reference) return coords;

  const closeLat = Math.abs(coords.lat - reference.lat) < 0.001;
  const closeLng = Math.abs(coords.lng - reference.lng) < 0.001;
  if (!closeLat || !closeLng) return coords;

  return {
    lat: coords.lat + minDistance,
    lng: coords.lng + minDistance * 0.65,
  };
}
