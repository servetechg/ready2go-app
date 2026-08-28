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
  const profileCoords = useMemo(() => coordsFromAddress(address), [address]);
  const [geocoded, setGeocoded] = useState<AlertCoordinates | null>(null);

  useEffect(() => {
    if (profileCoords) {
      setGeocoded(null);
      return;
    }

    const query = formatAddressLine(address).trim();
    if (!query || query === 'Address not set') return;

    let cancelled = false;
    void geocodeAlertLocation(query).then((coords) => {
      if (!cancelled && coords) setGeocoded(coords);
    });

    return () => {
      cancelled = true;
    };
  }, [
    profileCoords,
    address.streetAddress,
    address.city,
    address.state,
    address.zipCode,
  ]);

  return profileCoords ?? geocoded;
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
