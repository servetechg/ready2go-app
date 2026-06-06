import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_WEATHER_ALERT_PREFERENCES, MOCK_ALERTS } from '@/constants/dashboard';
import { logoutUser, refreshSession } from '@/redux/slices/authSlice';
import type { RootState } from '@/redux/store';
import { getHome, type HomeQuery } from '@/services/dashboard.service';
import { fetchEmergencyIncidents, fetchEmergencyMap } from '@/services/emergency.service';
import { isApiClientError } from '@/services/api/errors';
import type { DashboardHomeResponse } from '@/types/dashboard';
import type { DashboardMode, EmergencyDashboardData } from '@/types/emergency';
import type { WeatherAlert, WeatherAlertPreference } from '@/types/dashboard';
import {
  mapHomeNewsToEmergencyNewsItem,
  mapPreparednessCategory,
} from '@/utils/dashboardMappers';

interface DashboardState {
  home: DashboardHomeResponse | null;
  homeLoading: boolean;
  homeError: string | null;
  lastFetchedAt: number | null;
  unreadAlertsCount: number;
  /** Map + incident log loaded when mode is cloudy */
  emergency: EmergencyDashboardData | null;
  emergencyLoading: boolean;
  emergencyError: string | null;
  /** Alerts tab still uses this slice until Alerts tab API integration */
  alerts: WeatherAlert[];
  weatherAlertPreferences: WeatherAlertPreference[];
  searchQuery: string;
}

const initialState: DashboardState = {
  home: null,
  homeLoading: false,
  homeError: null,
  lastFetchedAt: null,
  unreadAlertsCount: 0,
  emergency: null,
  emergencyLoading: false,
  emergencyError: null,
  alerts: MOCK_ALERTS,
  weatherAlertPreferences: DEFAULT_WEATHER_ALERT_PREFERENCES,
  searchQuery: '',
};

export type FetchHomeResult = {
  home: DashboardHomeResponse;
  emergency: EmergencyDashboardData | null;
};

async function loadHomeWithToken(
  token: string,
  query?: HomeQuery,
): Promise<FetchHomeResult> {
  const home = await getHome(token, {
    newsLimit: 4,
    alertsLimit: 2,
    ...query,
  });

  let emergency: EmergencyDashboardData | null = null;

  if (home.mode === 'cloudy') {
    const [mapData, incidents] = await Promise.all([
      fetchEmergencyMap(token).catch(() => null),
      fetchEmergencyIncidents(token).catch(() => [] as EmergencyDashboardData['incidentLog']),
    ]);

    if (mapData) {
      emergency = {
        mode: 'cloudy',
        news: home.news.map(mapHomeNewsToEmergencyNewsItem),
        incidentLog: incidents,
        mapMarkers: mapData.mapMarkers,
        mapRegion: mapData.mapRegion,
      };
    }
  } else {
    emergency = {
      mode: 'blue_sky',
      news: home.news.map(mapHomeNewsToEmergencyNewsItem),
      incidentLog: [],
      mapMarkers: [],
      mapRegion: {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
    };
  }

  return { home, emergency };
}

export const fetchHome = createAsyncThunk<
  FetchHomeResult,
  HomeQuery | undefined,
  { state: RootState }
>('dashboard/fetchHome', async (query, { getState, dispatch, rejectWithValue }) => {
  const run = async (token: string) => loadHomeWithToken(token, query);

  let token = getState().auth.token;
  if (!token) return rejectWithValue('Not authenticated');

  try {
    return await run(token);
  } catch (error) {
    if (isApiClientError(error) && error.status === 401) {
      const refreshResult = await dispatch(refreshSession());
      if (refreshSession.fulfilled.match(refreshResult)) {
        token = refreshResult.payload.token;
        try {
          return await run(token);
        } catch (retryError) {
          return rejectWithValue(getErrorMessage(retryError));
        }
      }
    }
    return rejectWithValue(getErrorMessage(error));
  }
});

/** @deprecated Use fetchHome — kept for AlertsScreen pull-to-refresh until Alerts tab integration */
export const loadEmergencyDashboard = createAsyncThunk<
  FetchHomeResult,
  DashboardMode | undefined,
  { state: RootState }
>('dashboard/loadEmergencyDashboard', async (_, { dispatch }) => {
  return dispatch(fetchHome()).unwrap();
});

function getErrorMessage(error: unknown): string {
  if (isApiClientError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Failed to load dashboard';
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
      if (state.unreadAlertsCount > 0) {
        state.unreadAlertsCount = Math.max(0, state.unreadAlertsCount - 1);
      }
    },
    markAllAlertsRead: (state) => {
      state.alerts.forEach((a) => {
        a.read = true;
      });
      state.unreadAlertsCount = 0;
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
    clearDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHome.pending, (state) => {
        state.homeLoading = true;
        state.emergencyLoading = true;
        state.homeError = null;
        state.emergencyError = null;
      })
      .addCase(fetchHome.fulfilled, (state, action) => {
        state.homeLoading = false;
        state.emergencyLoading = false;
        state.home = action.payload.home;
        state.emergency = action.payload.emergency;
        state.lastFetchedAt = Date.now();
        state.unreadAlertsCount = action.payload.home.badges.unreadAlerts;
        state.homeError = null;
        state.emergencyError = null;
      })
      .addCase(fetchHome.rejected, (state, action) => {
        state.homeLoading = false;
        state.emergencyLoading = false;
        const message = (action.payload as string) ?? action.error.message ?? 'Failed to load home';
        state.homeError = message;
        state.emergencyError = message;
      })
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(logoutUser.rejected, () => initialState);
  },
});

export const {
  setSearchQuery,
  markAlertRead,
  markAllAlertsRead,
  toggleWeatherAlertPreference,
  setWeatherAlertPreference,
  clearDashboard,
} = dashboardSlice.actions;

export const selectUnreadAlertCount = (state: { dashboard: DashboardState }) =>
  state.dashboard.unreadAlertsCount;

export const selectDashboardMode = (state: { dashboard: DashboardState }): DashboardMode =>
  state.dashboard.home?.mode ?? 'blue_sky';

export const selectIsCloudyDay = (state: { dashboard: DashboardState }) =>
  selectDashboardMode(state) === 'cloudy';

export const selectPreparednessCategories = (state: { dashboard: DashboardState }) =>
  (state.dashboard.home?.preparednessCategories ?? []).map(mapPreparednessCategory);

export default dashboardSlice.reducer;
