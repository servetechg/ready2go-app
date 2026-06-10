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

export function normalizeMapMarkers(markers: MapMarkerPoint[]): MapMarkerPoint[] {
  return markers.map(normalizeMapMarker);
}

export function filterMarkersByLayers(
  markers: MapMarkerPoint[],
  enabledLayers: Record<GisMapLayerId, boolean>,
): MapMarkerPoint[] {
  return normalizeMapMarkers(markers).filter(
    (marker) => enabledLayers[resolveMarkerLayer(marker)],
  );
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
