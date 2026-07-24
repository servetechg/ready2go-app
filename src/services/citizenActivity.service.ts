import type { CitizenReportCategoryId } from '@/constants/citizenActivity';
import { apiRequest } from '@/services/api/client';

export type CitizenActivityItem = {
  id: string;
  category: string;
  title: string;
  line1: string;
  line2?: string;
  location?: string;
  timestamp: string;
  displayTime: string;
  priority: string;
  status?: string;
  resolutionStatus?: 'pending' | 'completed';
};

export const citizenActivityService = {
  async submitSafeCheckIn(
    token: string,
    body: { isSafe: boolean; message?: string },
  ): Promise<{ message: string; item: CitizenActivityItem }> {
    return apiRequest('/citizen-activity', {
      method: 'POST',
      token,
      body: { action: 'safe_checkin', ...body },
    });
  },

  async submitReport(
    token: string,
    body: {
      category: CitizenReportCategoryId;
      description: string;
      details?: string;
      lat?: number;
      lng?: number;
      location?: string;
    },
  ): Promise<{ message: string; item: CitizenActivityItem }> {
    return apiRequest('/citizen-activity', {
      method: 'POST',
      token,
      body: { action: 'report', ...body },
    });
  },

  async getHistory(token: string): Promise<{ items: CitizenActivityItem[] }> {
    return apiRequest('/citizen-activity?limit=20', { token });
  },
};
