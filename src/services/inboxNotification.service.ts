import type { InboxNotificationListResponse } from '@/types/notifications';
import { apiRequest } from '@/services/api/client';

export const inboxNotificationService = {
  async list(
    token: string,
    opts?: { limit?: number; unreadOnly?: boolean },
  ): Promise<InboxNotificationListResponse> {
    const params = new URLSearchParams();
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.unreadOnly) params.set('unreadOnly', 'true');
    const qs = params.toString();
    return apiRequest<InboxNotificationListResponse>(
      `/notifications${qs ? `?${qs}` : ''}`,
      { token },
    );
  },

  async markRead(
    token: string,
    id: string,
  ): Promise<{ item: InboxNotificationListResponse['items'][0]; unreadCount: number }> {
    return apiRequest(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      token,
    });
  },

  async markAllRead(token: string): Promise<{ message: string; unreadCount: number }> {
    return apiRequest('/notifications', {
      method: 'POST',
      token,
      body: { action: 'mark_all_read' },
    });
  },
};
