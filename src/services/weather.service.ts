import { apiRequest } from '@/services/api/client';
import type { WeatherAlertPreference, WeatherSnapshot } from '@/types/dashboard';

export type WeatherForecastDay = {
  date: string;
  label: string;
  condition: string;
  highF: number;
  lowF: number;
};

type PreferencesResponse = {
  preferences: Array<{
    id: string;
    label: string;
    enabled: boolean;
    description?: string;
    category?: string;
    severity?: string;
  }>;
};

function mapPreference(p: PreferencesResponse['preferences'][number]): WeatherAlertPreference {
  return {
    id: p.id,
    label: p.label,
    description: p.description?.trim() || `Notify when ${p.label} alerts are issued for your area.`,
    enabled: p.enabled,
    category: p.category,
    severity: p.severity,
  };
}

export const weatherService = {
  async getCurrent(token: string): Promise<WeatherSnapshot> {
    return apiRequest<WeatherSnapshot>('/weather/current', { token });
  },

  async getForecast(token: string, days = 7): Promise<{ days: WeatherForecastDay[] }> {
    return apiRequest<{ days: WeatherForecastDay[] }>(`/weather/forecast?days=${days}`, { token });
  },

  async getPreferences(token: string): Promise<WeatherAlertPreference[]> {
    const data = await apiRequest<PreferencesResponse>('/weather/preferences', { token });
    return (data.preferences ?? []).map(mapPreference);
  },

  async updatePreferences(
    token: string,
    preferences: { id: string; enabled: boolean }[],
  ): Promise<WeatherAlertPreference[]> {
    const data = await apiRequest<PreferencesResponse>('/weather/preferences', {
      method: 'PUT',
      token,
      body: { preferences },
    });
    return (data.preferences ?? []).map(mapPreference);
  },
};
