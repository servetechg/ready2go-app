import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { buildMockEmergencyDashboard } from '@/constants/emergency';
import { DEFAULT_WEATHER_ALERT_PREFERENCES, MOCK_ALERTS } from '@/constants/dashboard';
import { fetchEmergencyDashboard } from '@/services/emergency.service';
import type { DashboardMode, EmergencyDashboardData } from '@/types/emergency';
import type { WeatherAlert, WeatherAlertPreference } from '@/types/dashboard';

interface DashboardState {
  alerts: WeatherAlert[];
  weatherAlertPreferences: WeatherAlertPreference[];
  searchQuery: string;
  /** Optional override; null = use API/mock default */
  disruptionModeOverride: DashboardMode | null;
  emergency: EmergencyDashboardData | null;
  emergencyLoading: boolean;
  emergencyError: string | null;
}

const initialState: DashboardState = {
  alerts: MOCK_ALERTS,
  weatherAlertPreferences: DEFAULT_WEATHER_ALERT_PREFERENCES,
  searchQuery: '',
  disruptionModeOverride: null,
  emergency: buildMockEmergencyDashboard('cloudy'),
  emergencyLoading: false,
  emergencyError: null,
};

export const loadEmergencyDashboard = createAsyncThunk(
  'dashboard/loadEmergencyDashboard',
  async (mode: DashboardMode) => fetchEmergencyDashboard(mode),
);

function resolveMode(state: DashboardState): DashboardMode {
  return state.disruptionModeOverride ?? state.emergency?.mode ?? 'cloudy';
}

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
    setDisruptionModeOverride: (state, action: PayloadAction<DashboardMode | null>) => {
      state.disruptionModeOverride = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadEmergencyDashboard.pending, (state) => {
        state.emergencyLoading = true;
        state.emergencyError = null;
      })
      .addCase(loadEmergencyDashboard.fulfilled, (state, action) => {
        state.emergencyLoading = false;
        state.emergency = action.payload;
      })
      .addCase(loadEmergencyDashboard.rejected, (state, action) => {
        state.emergencyLoading = false;
        state.emergencyError = action.error.message ?? 'Failed to load emergency data';
      });
  },
});

export const {
  setSearchQuery,
  markAlertRead,
  markAllAlertsRead,
  toggleWeatherAlertPreference,
  setWeatherAlertPreference,
  setDisruptionModeOverride,
} = dashboardSlice.actions;

export const selectUnreadAlertCount = (state: { dashboard: DashboardState }) =>
  state.dashboard.alerts.filter((a) => !a.read).length;

export const selectDashboardMode = (state: { dashboard: DashboardState }): DashboardMode => {
  const dash = state.dashboard;
  return dash.disruptionModeOverride ?? dash.emergency?.mode ?? 'cloudy';
};

export const selectIsCloudyDay = (state: { dashboard: DashboardState }) =>
  selectDashboardMode(state) === 'cloudy';

export default dashboardSlice.reducer;
