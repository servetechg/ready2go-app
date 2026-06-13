import { DEFAULT_MAP_REGION } from '@/constants/emergency';
import type { AddressData } from '@/types/registration';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const DEFAULT_DELTA = { latitudeDelta: 0.08, longitudeDelta: 0.08 } as const;

/** Prefer API region, then profile address coords, then US default center. */
export function resolveMapRegion(
  apiRegion?: MapRegion | null,
  address?: Pick<AddressData, 'latitude' | 'longitude'>,
): MapRegion {
  if (
    apiRegion &&
    apiRegion.latitude !== 0 &&
    apiRegion.longitude !== 0 &&
    !Number.isNaN(apiRegion.latitude) &&
    !Number.isNaN(apiRegion.longitude)
  ) {
    return apiRegion;
  }

  const { latitude, longitude } = address ?? {};
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude)
  ) {
    return { latitude, longitude, ...DEFAULT_DELTA };
  }

  return { ...DEFAULT_MAP_REGION };
}

export function isValidMapRegion(region: MapRegion | null | undefined): boolean {
  return Boolean(
    region &&
      region.latitude !== 0 &&
      region.longitude !== 0 &&
      !Number.isNaN(region.latitude) &&
      !Number.isNaN(region.longitude),
  );
}
