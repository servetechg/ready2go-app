export type AlertCoordinates = { lat: number; lng: number };

function parseCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function isValidAlertCoordinatePair(lat: unknown, lng: unknown): boolean {
  const parsedLat = parseCoord(lat);
  const parsedLng = parseCoord(lng);
  if (parsedLat == null || parsedLng == null) return false;
  return (
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180 &&
    (parsedLat !== 0 || parsedLng !== 0)
  );
}

function toCoords(lat: number, lng: number): AlertCoordinates {
  return { lat, lng };
}

function readCoordinatePair(source: Record<string, unknown> | null | undefined): AlertCoordinates | null {
  if (!source) return null;

  const lat = source.lat ?? source.latitude;
  const lng = source.lng ?? source.lon ?? source.longitude;
  if (!isValidAlertCoordinatePair(lat, lng)) return null;
  return toCoords(parseCoord(lat)!, parseCoord(lng)!);
}

function centroidFromRing(ring: number[][]): AlertCoordinates | null {
  if (!Array.isArray(ring) || ring.length === 0) return null;

  let sumLat = 0;
  let sumLng = 0;
  let count = 0;

  for (const point of ring) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const lng = parseCoord(point[0]);
    const lat = parseCoord(point[1]);
    if (lat == null || lng == null) continue;
    sumLat += lat;
    sumLng += lng;
    count += 1;
  }

  if (count === 0) return null;
  const lat = sumLat / count;
  const lng = sumLng / count;
  if (!isValidAlertCoordinatePair(lat, lng)) return null;
  return toCoords(lat, lng);
}

function coordinatesFromGeometry(geometry: unknown): AlertCoordinates | null {
  if (!geometry || typeof geometry !== 'object') return null;

  const geo = geometry as Record<string, unknown>;
  const coordinates = geo.coordinates;
  if (!Array.isArray(coordinates)) return null;

  const type = String(geo.type ?? '').toLowerCase();
  if (type === 'point' && coordinates.length >= 2) {
    const lng = parseCoord(coordinates[0]);
    const lat = parseCoord(coordinates[1]);
    if (isValidAlertCoordinatePair(lat, lng)) {
      return toCoords(lat!, lng!);
    }
  }

  if (type === 'polygon' && Array.isArray(coordinates[0])) {
    return centroidFromRing(coordinates[0] as number[][]);
  }

  if (type === 'multipolygon' && Array.isArray(coordinates[0]?.[0])) {
    return centroidFromRing((coordinates[0] as number[][][])[0]);
  }

  if (coordinates.length >= 2 && typeof coordinates[0] === 'number') {
    const lng = parseCoord(coordinates[0]);
    const lat = parseCoord(coordinates[1]);
    if (isValidAlertCoordinatePair(lat, lng)) {
      return toCoords(lat!, lng!);
    }
  }

  return null;
}

export type ResolvedAlertCoordinates = {
  coords: AlertCoordinates;
  usedFallback: boolean;
};

/** Reads alert coordinates from common API shapes (lat/lng, coordinates, geometry, centroid). */
export function extractAlertCoordinates(alert: unknown): AlertCoordinates | null {
  if (!alert || typeof alert !== 'object') return null;
  const raw = alert as Record<string, unknown>;

  const direct = readCoordinatePair(raw);
  if (direct) return direct;

  if (raw.coordinates && typeof raw.coordinates === 'object') {
    const nested = readCoordinatePair(raw.coordinates as Record<string, unknown>);
    if (nested) return nested;
  }

  if (raw.centroid && typeof raw.centroid === 'object') {
    const nested = readCoordinatePair(raw.centroid as Record<string, unknown>);
    if (nested) return nested;
  }

  const fromGeometry = coordinatesFromGeometry(raw.geometry);
  if (fromGeometry) return fromGeometry;

  if (raw.location && typeof raw.location === 'object') {
    const nested = readCoordinatePair(raw.location as Record<string, unknown>);
    if (nested) return nested;
  }

  return null;
}

export function resolveAlertMapCoordinatesWithMeta(
  alert: unknown,
): ResolvedAlertCoordinates | null {
  const extracted = extractAlertCoordinates(alert);
  if (extracted) {
    return { coords: extracted, usedFallback: false };
  }

  return null;
}

export function resolveAlertMapCoordinates(alert: unknown): AlertCoordinates | null {
  return resolveAlertMapCoordinatesWithMeta(alert)?.coords ?? null;
}
