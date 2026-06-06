import { apiRequest } from '@/services/api/client';
import type { DashboardHomeResponse } from '@/types/dashboard';

export type HomeQuery = {
  include?: string[];
  newsLimit?: number;
  alertsLimit?: number;
};

export async function getHome(
  token: string,
  query?: HomeQuery,
): Promise<DashboardHomeResponse> {
  const params = new URLSearchParams();
  if (query?.include?.length) params.set('include', query.include.join(','));
  if (query?.newsLimit != null) params.set('newsLimit', String(query.newsLimit));
  if (query?.alertsLimit != null) params.set('alertsLimit', String(query.alertsLimit));
  const qs = params.toString();
  return apiRequest<DashboardHomeResponse>(`/dashboard/home${qs ? `?${qs}` : ''}`, { token });
}

export async function getBadges(token: string): Promise<{ unreadAlerts: number }> {
  return apiRequest<{ unreadAlerts: number }>('/dashboard/badges', { token });
}
