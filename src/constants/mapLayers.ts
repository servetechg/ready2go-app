import type { GisMapLayerId } from '@/types/emergency';

export type MapLayerConfig = {
  id: GisMapLayerId;
  label: string;
  /** Point markers vs polygon/raster overlays */
  kind: 'overlay' | 'point';
  color: string;
  icon: string;
  defaultEnabled: boolean;
};

export const GIS_MAP_LAYERS: MapLayerConfig[] = [
  {
    id: 'weatherRadar',
    label: 'Weather Radar',
    kind: 'overlay',
    color: '#1E88E5',
    icon: 'rainy-outline',
    defaultEnabled: true,
  },
  {
    id: 'riskAreas',
    label: 'Risk Areas',
    kind: 'overlay',
    color: '#00838F',
    icon: 'alert-circle-outline',
    defaultEnabled: true,
  },
  {
    id: 'floodZones',
    label: 'Flood Zones',
    kind: 'overlay',
    color: '#8D6E63',
    icon: 'water-outline',
    defaultEnabled: false,
  },
  {
    id: 'shelters',
    label: 'Shelters',
    kind: 'point',
    color: '#0288D1',
    icon: 'home',
    defaultEnabled: true,
  },
  {
    id: 'hospitals',
    label: 'Hospitals',
    kind: 'point',
    color: '#D32F2F',
    icon: 'medical',
    defaultEnabled: true,
  },
  {
    id: 'roadClosures',
    label: 'Roads & Traffic',
    kind: 'overlay',
    color: '#E65100',
    icon: 'car-outline',
    defaultEnabled: true,
  },
  {
    id: 'powerOutages',
    label: 'Power Outages',
    kind: 'point',
    color: '#F9A825',
    icon: 'flash-outline',
    defaultEnabled: true,
  },
  {
    id: 'waterIssues',
    label: 'Water Issues',
    kind: 'point',
    color: '#2E7D32',
    icon: 'water-outline',
    defaultEnabled: true,
  },
  {
    id: 'resourceSites',
    label: 'Resource Sites',
    kind: 'point',
    color: '#6A1B9A',
    icon: 'storefront',
    defaultEnabled: true,
  },
  {
    id: 'incidentReports',
    label: 'Incident Heatmap',
    kind: 'point',
    color: '#C62828',
    icon: 'flame',
    defaultEnabled: true,
  },
];

export const DEFAULT_GIS_LAYER_STATE: Record<GisMapLayerId, boolean> = GIS_MAP_LAYERS.reduce(
  (acc, layer) => {
    acc[layer.id] = layer.defaultEnabled;
    return acc;
  },
  {} as Record<GisMapLayerId, boolean>,
);

export function getMapLayerConfig(id: GisMapLayerId): MapLayerConfig {
  return GIS_MAP_LAYERS.find((layer) => layer.id === id) ?? GIS_MAP_LAYERS[0];
}
