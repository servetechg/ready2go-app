import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_WEATHER_ALERT_PREFERENCES } from '@/constants/dashboard';
import { logoutUser, refreshSession } from '@/redux/slices/authSlice';
import type { RootState } from '@/redux/store';
import { isApiClientError } from '@/services/api/errors';
import { getHome, type HomeQuery } from '@/services/dashboard.service';
import { fetchEmergencyIncidents, fetchEmergencyMap } from '@/services/emergency.service';
import type { DashboardHomeResponse, WeatherAlertPreference } from '@/types/dashboard';
import type { DashboardMode, EmergencyDashboardData } from '@/types/emergency';
import {
    mapHomeNewsToEmergencyNewsItem,
    mapPreparednessCategory,
} from '@/utils/dashboardMappers';
import { resolveMapRegion } from '@/utils/mapRegion';

interface DashboardState {
  home: DashboardHomeResponse | null;
  homeLoading: boolean;
  homeError: string | null;
  lastFetchedAt: number | null;
  unreadAlertsCount: number;
  /** GIS map data — always loaded on Home (markers/overlays heavier in cloudy mode) */
  emergency: EmergencyDashboardData | null;
  emergencyLoading: boolean;
  emergencyError: string | null;
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
  weatherAlertPreferences: DEFAULT_WEATHER_ALERT_PREFERENCES,
  searchQuery: '',
};

export type FetchHomeResult = {
  home: DashboardHomeResponse;
  emergency: EmergencyDashboardData | null;
};

async function loadHomeWithToken(
  token: string,
  getState: () => RootState,
  query?: HomeQuery,
): Promise<FetchHomeResult> {
  const home = await getHome(token, {
    newsLimit: 4,
    alertsLimit: 2,
    ...query,
  });

  const registration = getState().registration;
  const isCloudy = home.mode === 'cloudy';

  const [mapData, incidents] = await Promise.all([
    fetchEmergencyMap(token).catch(() => null),
    isCloudy
      ? fetchEmergencyIncidents(token).catch(() => [] as EmergencyDashboardData['incidentLog'])
      : Promise.resolve([] as EmergencyDashboardData['incidentLog']),
  ]);

  const emergency: EmergencyDashboardData = {
    mode: home.mode,
    news: (home.news ?? []).map(mapHomeNewsToEmergencyNewsItem),
    incidentLog: incidents ?? [],
    mapMarkers: mapData?.mapMarkers ?? [],
    mapOverlays: mapData?.mapOverlays ?? [],
    mapRegion: resolveMapRegion(mapData?.mapRegion, registration.address),
  };

  return { home, emergency };
}

export const fetchHome = createAsyncThunk<
  FetchHomeResult,
  HomeQuery | undefined,
  { state: RootState }
>('dashboard/fetchHome', async (query, { getState, dispatch, rejectWithValue }) => {
  const run = async (token: string) => loadHomeWithToken(token, getState, query);

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
  toggleWeatherAlertPreference,
  setWeatherAlertPreference,
  clearDashboard,
} = dashboardSlice.actions;

export const selectDashboardMode = (state: { dashboard: DashboardState }): DashboardMode =>
  state.dashboard.home?.mode ?? 'blue_sky';

export const selectIsCloudyDay = (state: { dashboard: DashboardState }) =>
  selectDashboardMode(state) === 'cloudy';

const EMPTY_PREPAREDNESS_CATEGORIES: ReturnType<typeof mapPreparednessCategory>[] = [];

export const selectPreparednessCategories = createSelector(
  [(state: RootState) => state.dashboard.home?.preparednessCategories],
  (categories) => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return EMPTY_PREPAREDNESS_CATEGORIES;
    }
    return categories.map(mapPreparednessCategory);
  },
);

export default dashboardSlice.reducer;
