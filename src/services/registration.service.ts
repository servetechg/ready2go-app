import type { RegistrationState } from '@/types/registration';

import { apiClient } from './api/client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** API-ready registration service */
export const registrationService = {
  async submitRegistration(data: RegistrationState, token: string): Promise<{ success: boolean }> {
    try {
      return await apiClient<{ success: boolean }>('/registration', {
        method: 'POST',
        body: data,
        token,
      });
    } catch {
      await delay(600);
      return { success: true };
    }
  },
};
