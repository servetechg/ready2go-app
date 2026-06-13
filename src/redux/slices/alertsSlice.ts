import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { logoutUser, refreshSession } from '@/redux/slices/authSlice';
import type { RootState } from '@/redux/store';
import * as alertsService from '@/services/alerts.service';
import { isApiClientError } from '@/services/api/errors';
import type { AlertsQuery, AlertsSort, MobileWeatherAlert } from '@/types/alerts';
import type { AlertSeverity } from '@/types/dashboard';
import { getErrorMessage } from '@/utils/error';

export type AlertsFilters = {
  sort: AlertsSort;
  severity?: AlertSeverity;
  read?: boolean;
  q: string;
};

interface AlertsState {
  items: MobileWeatherAlert[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  unreadCount: number | null;
  filters: AlertsFilters;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

const initialState: AlertsState = {
  items: [],
  page: 0,
  limit: 20,
  total: 0,
  hasMore: false,
  unreadCount: null,
  filters: { sort: 'recent', q: '' },
  loading: false,
  loadingMore: false,
  error: null,
  lastFetchedAt: null,
};

async function withAuthRetry<T>(
  getState: () => RootState,
  dispatch: (action: unknown) => unknown,
  fn: (token: string) => Promise<T>,
): Promise<T> {
  let token = getState().auth.token;
  if (!token) throw new Error('Not authenticated');

  try {
    return await fn(token);
  } catch (error) {
    if (isApiClientError(error) && error.status === 401) {
      const refreshResult = await dispatch(refreshSession());
      if (refreshSession.fulfilled.match(refreshResult)) {
        return await fn(refreshResult.payload.token);
      }
    }
    throw error;
  }
}

function buildQuery(state: AlertsState, page: number): AlertsQuery {
  const { filters, limit } = state;
  return {
    sort: filters.sort,
    severity: filters.severity,
    read: filters.read,
    q: filters.q.trim() || undefined,
    page,
    limit,
  };
}

export const fetchAlerts = createAsyncThunk<
  Awaited<ReturnType<typeof alertsService.listAlerts>>,
  void,
  { state: RootState }
>(
  'alerts/fetchAlerts',
  async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    return await withAuthRetry(getState, dispatch, (token) =>
      alertsService.listAlerts(token, buildQuery(getState().alerts, 1)),
    );
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load alerts'));
  }
},
  {
    condition: (_, { getState }) => !getState().alerts.loading,
  },
);

export const fetchMoreAlerts = createAsyncThunk<
  Awaited<ReturnType<typeof alertsService.listAlerts>>,
  void,
  { state: RootState }
>('alerts/fetchMoreAlerts', async (_, { getState, dispatch, rejectWithValue }) => {
  const { hasMore, loadingMore, page } = getState().alerts;
  if (!hasMore || loadingMore) return rejectWithValue('No more alerts');

  try {
    return await withAuthRetry(getState, dispatch, (token) =>
      alertsService.listAlerts(token, buildQuery(getState().alerts, page + 1)),
    );
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load more alerts'));
  }
});

export const markAlertReadRemote = createAsyncThunk<
  { alertId: string; unreadCount: number },
  string,
  { state: RootState }
>('alerts/markAlertRead', async (alertId, { getState, dispatch, rejectWithValue }) => {
  try {
    const result = await withAuthRetry(getState, dispatch, (token) =>
      alertsService.markAlertRead(token, alertId, true),
    );
    return { alertId, unreadCount: result.unreadCount };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not update alert'));
  }
});

export const markAllAlertsReadRemote = createAsyncThunk<
  number,
  void,
  { state: RootState }
>('alerts/markAllAlertsRead', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    const result = await withAuthRetry(getState, dispatch, (token) =>
      alertsService.markAllAlertsRead(token),
    );
    return result.unreadCount;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not mark alerts read'));
  }
});

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setAlertsSort: (state, action: PayloadAction<AlertsSort>) => {
      state.filters.sort = action.payload;
    },
    setAlertsSeverityFilter: (state, action: PayloadAction<AlertSeverity | undefined>) => {
      state.filters.severity = action.payload;
    },
    setAlertsReadFilter: (state, action: PayloadAction<boolean | undefined>) => {
      state.filters.read = action.payload;
    },
    setAlertsSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.q = action.payload;
    },
    setAlertsUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    clearAlerts: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items ?? [];
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
        state.hasMore = action.payload.hasMore;
        state.unreadCount = action.payload.unreadCount;
        state.lastFetchedAt = Date.now();
        state.error = null;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Failed to load alerts';
      })
      .addCase(fetchMoreAlerts.pending, (state) => {
        state.loadingMore = true;
      })
      .addCase(fetchMoreAlerts.fulfilled, (state, action) => {
        state.loadingMore = false;
        const existingIds = new Set((state.items ?? []).map((item) => item.id));
        const next = (action.payload.items ?? []).filter((item) => !existingIds.has(item.id));
        state.items.push(...next);
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchMoreAlerts.rejected, (state) => {
        state.loadingMore = false;
      })
      .addCase(markAlertReadRemote.fulfilled, (state, action) => {
        const alert = state.items.find((item) => item.id === action.payload.alertId);
        if (alert) alert.read = true;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markAllAlertsReadRemote.fulfilled, (state, action) => {
        state.items.forEach((item) => {
          item.read = true;
        });
        state.unreadCount = action.payload;
      })
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(logoutUser.rejected, () => initialState);
  },
});

export const {
  setAlertsSort,
  setAlertsSeverityFilter,
  setAlertsReadFilter,
  setAlertsSearchQuery,
  setAlertsUnreadCount,
  clearAlerts,
} = alertsSlice.actions;

export const selectAlertsItems = (state: RootState) => state.alerts.items;
export const selectAlertsLoading = (state: RootState) => state.alerts.loading;
export const selectAlertsError = (state: RootState) => state.alerts.error;
export const selectAlertsFilters = (state: RootState) => state.alerts.filters;
export const selectAlertsHasMore = (state: RootState) => state.alerts.hasMore;
export const selectAlertsLoadingMore = (state: RootState) => state.alerts.loadingMore;

/** Prefer alerts API count; fall back to home badge before first alerts fetch. */
export const selectUnreadAlertCount = (state: RootState) =>
  state.alerts.unreadCount ?? state.dashboard.unreadAlertsCount;

export default alertsSlice.reducer;
