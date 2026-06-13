import type { AlertSeverity, MobileWeatherAlert } from '@/types/dashboard';

export type AlertsSort = 'recent' | 'severity';

export type { MobileWeatherAlert };

export type AlertsListResponse = {
  items: MobileWeatherAlert[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  unreadCount: number;
};

export type AlertsQuery = {
  sort?: AlertsSort;
  severity?: AlertSeverity;
  read?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};
