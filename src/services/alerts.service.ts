import { apiRequest } from '@/services/api/client';
import type { AlertsListResponse, AlertsQuery, MobileWeatherAlert } from '@/types/alerts';

function buildAlertsQueryParams(query?: AlertsQuery): string {
  const params = new URLSearchParams();
  if (query?.sort) params.set('sort', query.sort);
  if (query?.severity) params.set('severity', query.severity);
  if (query?.read != null) params.set('read', String(query.read));
  if (query?.q?.trim()) params.set('q', query.q.trim());
  if (query?.page != null) params.set('page', String(query.page));
  if (query?.limit != null) params.set('limit', String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listAlerts(
  token: string,
  query?: AlertsQuery,
): Promise<AlertsListResponse> {
  return apiRequest<AlertsListResponse>(`/alerts${buildAlertsQueryParams(query)}`, { token });
}

export async function getAlert(token: string, id: string): Promise<MobileWeatherAlert> {
  return apiRequest<MobileWeatherAlert>(`/alerts/${encodeURIComponent(id)}`, { token });
}

export async function markAlertRead(
  token: string,
  id: string,
  read = true,
): Promise<{ message: string; unreadCount: number }> {
  return apiRequest<{ message: string; unreadCount: number }>(
    `/alerts/${encodeURIComponent(id)}/read`,
    { method: 'PATCH', token, body: { read } },
  );
}

export async function markAllAlertsRead(
  token: string,
): Promise<{ message: string; unreadCount: number }> {
  return apiRequest<{ message: string; unreadCount: number }>('/alerts/mark-all-read', {
    method: 'POST',
    token,
  });
}

export async function getUnreadCount(token: string): Promise<{ unreadCount: number }> {
  return apiRequest<{ unreadCount: number }>('/alerts/unread-count', { token });
}
