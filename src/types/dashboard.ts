export type AlertSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  location: string;
  source: string;
  issuedAgo: string;
  expires: string;
  read: boolean;
}

export interface WeatherSnapshot {
  temperatureF: number;
  condition: string;
  highF: number;
  lowF: number;
  humidity: number;
  windMph: number;
  locationLabel: string;
}

export interface PreparednessCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: 'flame' | 'medkit' | 'globe' | 'location';
  taskCount: number;
}

export interface WeatherAlertPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface DashboardQuickAction {
  id: string;
  title: string;
  icon: 'cloud' | 'shield' | 'map' | 'people' | 'newspaper' | 'alert-circle';
  route: string;
}
