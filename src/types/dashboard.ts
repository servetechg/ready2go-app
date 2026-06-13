import type { DashboardMode } from '@/types/emergency';

export type AlertSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

/** Alert shape returned by GET /dashboard/home and GET /alerts. */
export interface MobileWeatherAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  location: string;
  source: string;
  issuedAt: string;
  expiresAt?: string | null;
  expiresLabel?: string;
  read: boolean;
  description?: string;
}

export type DashboardStatus = {
  headline: string;
  summary: string;
  severity: AlertSeverity;
  updatedAt: string;
};

export type DashboardHomeNewsItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  source: string;
  severity: string;
  category: string;
  location: string;
  icon: string;
};

export type MobilePreparednessCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  taskCount: number;
};

export type DashboardHomeResponse = {
  mode: DashboardMode;
  status: DashboardStatus;
  news: DashboardHomeNewsItem[];
  weather: WeatherSnapshot | null;
  recentAlerts: MobileWeatherAlert[];
  preparednessCategories: MobilePreparednessCategory[];
  badges: { unreadAlerts: number };
};

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

export type { PreparednessCategory, PreparednessTask } from '@/types/preparedness';

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
