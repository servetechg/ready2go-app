import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_WEATHER_ALERT_PREFERENCES, MOCK_ALERTS } from '@/constants/dashboard';
import type { WeatherAlert, WeatherAlertPreference } from '@/types/dashboard';

interface DashboardState {
  alerts: WeatherAlert[];
  weatherAlertPreferences: WeatherAlertPreference[];
  searchQuery: string;
}

const initialState: DashboardState = {
  alerts: MOCK_ALERTS,
  weatherAlertPreferences: DEFAULT_WEATHER_ALERT_PREFERENCES,
  searchQuery: '',
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    markAlertRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a.id === action.payload);
      if (alert) alert.read = true;
    },
    markAllAlertsRead: (state) => {
      state.alerts.forEach((a) => {
        a.read = true;
      });
    },
    toggleWeatherAlertPreference: (state, action: PayloadAction<string>) => {
      const pref = state.weatherAlertPreferences.find((p) => p.id === action.payload);
      if (pref) pref.enabled = !pref.enabled;
    },
    setWeatherAlertPreference: (
      state,
      action: PayloadAction<{ id: string; enabled: boolean }>,
    ) => {
      const pref = state.weatherAlertPreferences.find((p) => p.id === action.payload.id);
      if (pref) pref.enabled = action.payload.enabled;
    },
  },
});

export const {
  setSearchQuery,
  markAlertRead,
  markAllAlertsRead,
  toggleWeatherAlertPreference,
  setWeatherAlertPreference,
} = dashboardSlice.actions;

export const selectUnreadAlertCount = (state: { dashboard: DashboardState }) =>
  state.dashboard.alerts.filter((a) => !a.read).length;

export default dashboardSlice.reducer;
