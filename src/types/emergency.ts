export type DashboardMode = 'blue_sky' | 'cloudy';

export type NewsFeedSource = 'emergency' | 'admin' | 'news' | 'community' | 'nws';

export type NewsSeverity = 'info' | 'warning' | 'critical';

export type NewsCategory = 'ADVISORY' | 'PREPAREDNESS' | 'ADMIN' | 'REGIONAL' | (string & {});

export type NewsIconType =
  | 'newspaper-outline'
  | 'megaphone-outline'
  | 'shield-checkmark-outline'
  | 'globe-outline'
  | 'medkit-outline'
  | 'alert-circle-outline';

export interface EmergencyNewsItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  source: NewsFeedSource;
  severity?: NewsSeverity;
  category?: NewsCategory;
  location?: string;
  icon?: NewsIconType;
  url?: string;
  imageUrl?: string;
  publisher?: string;
  sourceName?: string;
}

export type EmergencyNewsResponse = {
  items: EmergencyNewsItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  stateCode?: string | null;
};

export interface IncidentLogEntry {
  id: string;
  message: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
}

export interface MapMarkerPoint {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  layer?: GisMapLayerId;
  severity?: string;
  /** Legacy API field — mapped to `layer` client-side */
  type?: 'closure' | 'shelter' | 'resource' | 'hazard';
}

export type GisMapLayerId =
  | 'weatherRadar'
  | 'riskAreas'
  | 'floodZones'
  | 'shelters'
  | 'hospitals'
  | 'roadClosures'
  | 'powerOutages'
  | 'waterIssues'
  | 'resourceSites'
  | 'incidentReports';

export interface MapPolygonOverlay {
  id: string;
  layer: Extract<GisMapLayerId, 'weatherRadar' | 'riskAreas' | 'floodZones'>;
  coordinates: Array<{ latitude: number; longitude: number }>;
  fillColor?: string;
  strokeColor?: string;
}

export interface EmergencyDashboardData {
  mode: DashboardMode;
  news: EmergencyNewsItem[];
  incidentLog: IncidentLogEntry[];
  mapMarkers: MapMarkerPoint[];
  mapOverlays: MapPolygonOverlay[];
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}
