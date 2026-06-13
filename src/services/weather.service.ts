import { apiRequest } from '@/services/api/client';
import type { WeatherSnapshot } from '@/types/dashboard';

export type WeatherForecastDay = {
  date: string;
  label: string;
  condition: string;
  highF: number;
  lowF: number;
};

export const weatherService = {
  async getCurrent(token: string): Promise<WeatherSnapshot> {
    return apiRequest<WeatherSnapshot>('/weather/current', { token });
  },

  async getForecast(token: string, days = 7): Promise<{ days: WeatherForecastDay[] }> {
    return apiRequest<{ days: WeatherForecastDay[] }>(`/weather/forecast?days=${days}`, { token });
  },
};
