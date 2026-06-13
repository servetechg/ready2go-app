import { getMapLayerConfig } from '@/constants/mapLayers';
import type { GisMapLayerId, MapMarkerPoint, MapPolygonOverlay } from '@/types/emergency';

const LEGACY_TYPE_TO_LAYER: Record<
  NonNullable<MapMarkerPoint['type']>,
  GisMapLayerId
> = {
  closure: 'roadClosures',
  shelter: 'shelters',
  resource: 'resourceSites',
  hazard: 'incidentReports',
};

export function resolveMarkerLayer(marker: MapMarkerPoint): GisMapLayerId {
  if (marker.layer) return marker.layer;
  if (marker.type) return LEGACY_TYPE_TO_LAYER[marker.type];
  return 'incidentReports';
}

export function normalizeMapMarker(marker: MapMarkerPoint): MapMarkerPoint {
  const layer = resolveMarkerLayer(marker);
  return {
    ...marker,
    layer,
  };
}

export function normalizeMapMarkers(markers: MapMarkerPoint[] | null | undefined): MapMarkerPoint[] {
  if (!Array.isArray(markers)) return [];
  return markers.map(normalizeMapMarker);
}

/** Layers rendered as a heatmap instead of pin markers. */
export const HEATMAP_LAYER_IDS: GisMapLayerId[] = ['incidentReports'];

/** Point layers hidden when only traffic overlay is used for roads. */
export const TRAFFIC_ONLY_LAYER_IDS: GisMapLayerId[] = ['roadClosures'];

export function filterMarkersByLayers(
  markers: MapMarkerPoint[],
  enabledLayers: Record<GisMapLayerId, boolean>,
): MapMarkerPoint[] {
  return normalizeMapMarkers(markers).filter(
    (marker) => enabledLayers[resolveMarkerLayer(marker)],
  );
}

export function filterPointMarkersForMap(
  markers: MapMarkerPoint[],
  enabledLayers: Record<GisMapLayerId, boolean>,
): MapMarkerPoint[] {
  return filterMarkersByLayers(markers, enabledLayers).filter((marker) => {
    const layer = resolveMarkerLayer(marker);
    if (HEATMAP_LAYER_IDS.includes(layer)) return false;
    if (TRAFFIC_ONLY_LAYER_IDS.includes(layer)) return false;
    return true;
  });
}

export type HeatmapPoint = {
  latitude: number;
  longitude: number;
  weight: number;
};

export function filterIncidentMarkersForHeatmap(
  markers: MapMarkerPoint[],
  enabledLayers: Record<GisMapLayerId, boolean>,
): MapMarkerPoint[] {
  if (!enabledLayers.incidentReports) return [];

  return filterMarkersByLayers(markers, enabledLayers).filter((marker) =>
    HEATMAP_LAYER_IDS.includes(resolveMarkerLayer(marker)),
  );
}

export function buildHeatmapPoints(
  markers: MapMarkerPoint[],
  enabledLayers: Record<GisMapLayerId, boolean>,
): HeatmapPoint[] {
  return filterIncidentMarkersForHeatmap(markers, enabledLayers).map((marker) => ({
    latitude: marker.latitude,
    longitude: marker.longitude,
    weight: marker.severity === 'HIGH' || marker.severity === 'EXTREME' ? 2 : 1,
  }));
}

export function filterOverlaysByLayers(
  overlays: MapPolygonOverlay[],
  enabledLayers: Record<GisMapLayerId, boolean>,
): MapPolygonOverlay[] {
  return overlays.filter((overlay) => enabledLayers[overlay.layer]);
}

export function getMarkerPinColor(layer: GisMapLayerId): string {
  return getMapLayerConfig(layer).color;
}

export function overlayColors(layer: GisMapLayerId): { fill: string; stroke: string } {
  const config = getMapLayerConfig(layer);
  switch (layer) {
    case 'weatherRadar':
      return { fill: 'rgba(30, 136, 229, 0.22)', stroke: 'rgba(30, 136, 229, 0.55)' };
    case 'riskAreas':
      return { fill: 'rgba(0, 131, 143, 0.2)', stroke: 'rgba(0, 131, 143, 0.6)' };
    case 'floodZones':
      return { fill: 'rgba(141, 110, 99, 0.25)', stroke: 'rgba(141, 110, 99, 0.7)' };
    default:
      return { fill: `${config.color}33`, stroke: config.color };
  }
}
