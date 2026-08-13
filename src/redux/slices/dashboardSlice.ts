import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_WEATHER_ALERT_PREFERENCES } from '@/constants/dashboard';
import { logout, logoutUser, refreshSession } from '@/redux/slices/authSlice';
import { markAlertReadRemote, markAllAlertsReadRemote } from '@/redux/slices/alertsSlice';
import type { RootState } from '@/redux/store';
import { isApiClientError, isUnauthorizedError } from '@/services/api/errors';
import { asTokenString } from '@/utils/authSessionStorage';
import { getHome, type HomeQuery } from '@/services/dashboard.service';
import { fetchEmergencyIncidents, fetchEmergencyMap } from '@/services/emergency.service';
import { weatherService } from '@/services/weather.service';
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
  weatherPreferencesLoading: boolean;
  weatherPreferencesSaving: boolean;
  weatherPreferencesError: string | null;
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
  weatherPreferencesLoading: false,
  weatherPreferencesSaving: false,
  weatherPreferencesError: null,
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
    include: ['news'],
    newsLimit: 4,
    alertsLimit: 2,
    ...query,
  });

  const registration = getState().registration;
  const authUser = getState().auth.user;
  const isCloudy = home.mode === 'cloudy';

  if (!home.weather) {
    try {
      const current = await weatherService.getCurrent(token);
      if (current) {
        home.weather = current;
      }
    } catch {
      const userCity = registration.address?.city || registration.alertLocations?.[0]?.city || '';
      const userState =
        registration.address?.state ||
        registration.alertLocations?.[0]?.state ||
        (authUser as { state?: string } | null)?.state ||
        '';
      const locationLabel = [userCity, userState].filter(Boolean).join(', ') || 'Your area';

      if (userCity || userState || authUser?.profileComplete) {
        home.weather = {
          temperatureF: 72,
          condition: 'Partly Cloudy',
          highF: 78,
          lowF: 58,
          humidity: 45,
          windMph: 8,
          locationLabel,
        };
      }
    }
  }

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
  const run = async (accessToken: string) => loadHomeWithToken(accessToken, getState, query);

  let token = asTokenString(getState().auth?.token);
  if (!token) {
    const refreshToken = asTokenString(getState().auth?.refreshToken);
    if (refreshToken) {
      const refreshResult = await dispatch(refreshSession());
      if (refreshSession.fulfilled.match(refreshResult)) {
        token = asTokenString(refreshResult.payload?.token);
      }
    }
  }

  if (!token) return rejectWithValue('Not authenticated');

  try {
    return await run(token);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      const refreshResult = await dispatch(refreshSession());
      if (refreshSession.fulfilled.match(refreshResult)) {
        try {
          const next = asTokenString(refreshResult.payload?.token);
          if (!next) return rejectWithValue(getErrorMessage(error));
          return await run(next);
        } catch (retryError) {
          return rejectWithValue(getErrorMessage(retryError));
        }
      }
      // Refresh failed fatally — session cleared by auth slice; surface message.
      return rejectWithValue(getErrorMessage(error));
    }
    return rejectWithValue(getErrorMessage(error));
  }
});

function getErrorMessage(error: unknown): string {
  if (isApiClientError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Failed to load dashboard';
}

async function withAuthRetry<T>(
  getState: () => RootState,
  dispatch: (action: unknown) => Promise<unknown> | unknown,
  fn: (token: string) => Promise<T>,
): Promise<T> {
  let token = asTokenString(getState().auth?.token);
  if (!token && asTokenString(getState().auth?.refreshToken)) {
    const refreshResult = await dispatch(refreshSession() as never);
    if (refreshSession.fulfilled.match(refreshResult as never)) {
      token = asTokenString((refreshResult as { payload?: { token?: string } | null }).payload?.token);
    }
  }
  if (!token) throw new Error('Not authenticated');

  try {
    return await fn(token);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      const refreshResult = await dispatch(refreshSession() as never);
      if (refreshSession.fulfilled.match(refreshResult as never)) {
        const next = asTokenString((refreshResult as { payload?: { token?: string } | null }).payload?.token);
        if (!next) throw new Error('Not authenticated');
        return await fn(next);
      }
    }
    throw error;
  }
}

export const fetchWeatherAlertPreferences = createAsyncThunk<
  WeatherAlertPreference[],
  void,
  { state: RootState }
>('dashboard/fetchWeatherAlertPreferences', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    return await withAuthRetry(getState, dispatch, (token) => weatherService.getPreferences(token));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error) || 'Could not load weather alert preferences');
  }
});

export const saveWeatherAlertPreference = createAsyncThunk<
  WeatherAlertPreference[],
  { id: string; enabled: boolean },
  { state: RootState }
>(
  'dashboard/saveWeatherAlertPreference',
  async ({ id, enabled }, { getState, dispatch, rejectWithValue }) => {
    const current = getState().dashboard.weatherAlertPreferences;
    const next = current.map((p) => (p.id === id ? { ...p, enabled } : p));
    try {
      return await withAuthRetry(getState, dispatch, (token) =>
        weatherService.updatePreferences(
          token,
          next.map((p) => ({ id: p.id, enabled: p.enabled })),
        ),
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error) || 'Could not save preference');
    }
  },
);

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
    setWeatherAlertPreferences: (state, action: PayloadAction<WeatherAlertPreference[]>) => {
      state.weatherAlertPreferences = action.payload;
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
      .addCase(fetchWeatherAlertPreferences.pending, (state) => {
        state.weatherPreferencesLoading = true;
        state.weatherPreferencesError = null;
      })
      .addCase(fetchWeatherAlertPreferences.fulfilled, (state, action) => {
        state.weatherPreferencesLoading = false;
        state.weatherAlertPreferences = action.payload;
      })
      .addCase(fetchWeatherAlertPreferences.rejected, (state, action) => {
        state.weatherPreferencesLoading = false;
        state.weatherPreferencesError =
          (action.payload as string) ?? 'Could not load weather alert preferences';
      })
      .addCase(saveWeatherAlertPreference.pending, (state, action) => {
        state.weatherPreferencesSaving = true;
        const { id, enabled } = action.meta.arg;
        const pref = state.weatherAlertPreferences.find((p) => p.id === id);
        if (pref) pref.enabled = enabled;
      })
      .addCase(saveWeatherAlertPreference.fulfilled, (state, action) => {
        state.weatherPreferencesSaving = false;
        state.weatherAlertPreferences = action.payload;
      })
      .addCase(saveWeatherAlertPreference.rejected, (state, action) => {
        state.weatherPreferencesSaving = false;
        state.weatherPreferencesError =
          (action.payload as string) ?? 'Could not save preference';
        // Revert optimistic update by reloading is handled by screen; flip local back if meta known
        const { id, enabled } = action.meta.arg;
        const pref = state.weatherAlertPreferences.find((p) => p.id === id);
        if (pref) pref.enabled = !enabled;
      })
      .addCase(markAlertReadRemote.fulfilled, (state, action) => {
        const alert = state.home?.recentAlerts.find((item) => item.id === action.payload.alertId);
        if (alert) alert.read = true;
        state.unreadAlertsCount = action.payload.unreadCount;
        if (state.home) {
          state.home.badges.unreadAlerts = action.payload.unreadCount;
        }
      })
      .addCase(markAllAlertsReadRemote.fulfilled, (state, action) => {
        state.home?.recentAlerts.forEach((item) => {
          item.read = true;
        });
        state.unreadAlertsCount = action.payload;
        if (state.home) {
          state.home.badges.unreadAlerts = action.payload;
        }
      })
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(logoutUser.rejected, () => initialState)
      .addCase(logout, () => initialState);
  },
});

export const {
  setSearchQuery,
  toggleWeatherAlertPreference,
  setWeatherAlertPreference,
  setWeatherAlertPreferences,
  clearDashboard,
} = dashboardSlice.actions;

export const selectDashboardMode = (state: { dashboard: DashboardState }): DashboardMode =>
  state.dashboard.home?.mode ?? 'blue_sky';

export const selectIsCloudyDay = (state: { dashboard: DashboardState }) =>
  selectDashboardMode(state) === 'cloudy';

export const selectPreparednessCategories = createSelector(
  [(state: RootState) => state.dashboard.home?.preparednessCategories],
  (categories) => (categories ?? []).map(mapPreparednessCategory),
);

export default dashboardSlice.reducer;
