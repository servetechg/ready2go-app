export type DashboardMode = 'blue_sky' | 'cloudy';

export type NewsFeedSource = 'emergency' | 'admin';

export type NewsCategory = 'ADVISORY' | 'PREPAREDNESS' | 'ADMIN' | 'REGIONAL';

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
  severity?: 'info' | 'warning' | 'critical';
  category?: NewsCategory;
  location?: string;
  icon?: NewsIconType;
}

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
  type: 'closure' | 'shelter' | 'resource' | 'hazard';
}

export interface EmergencyDashboardData {
  mode: DashboardMode;
  news: EmergencyNewsItem[];
  incidentLog: IncidentLogEntry[];
  mapMarkers: MapMarkerPoint[];
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}
