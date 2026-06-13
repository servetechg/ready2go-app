import type { MapMarkerPoint } from '@/types/emergency';

/** Approximate degrees threshold scaled to current map zoom. */
export function heatmapTapThresholdDegrees(latitudeDelta: number, longitudeDelta: number): number {
  return Math.max(latitudeDelta, longitudeDelta) * 0.18;
}

export function findNearestMapMarker(
  markers: MapMarkerPoint[],
  latitude: number,
  longitude: number,
  maxDegrees: number,
): MapMarkerPoint | null {
  let nearest: MapMarkerPoint | null = null;
  let nearestDist = Infinity;

  for (const marker of markers) {
    const dLat = marker.latitude - latitude;
    const dLng = marker.longitude - longitude;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist <= maxDegrees && dist < nearestDist) {
      nearestDist = dist;
      nearest = marker;
    }
  }

  return nearest;
}
