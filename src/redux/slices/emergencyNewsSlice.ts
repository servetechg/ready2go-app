import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { logoutUser, refreshSession } from '@/redux/slices/authSlice';
import type { RootState } from '@/redux/store';
import { isApiClientError } from '@/services/api/errors';
import {
  fetchEmergencyNews,
  type EmergencyNewsQuery,
} from '@/services/emergency.service';
import type { EmergencyNewsItem } from '@/types/emergency';
import { getErrorMessage } from '@/utils/error';

interface EmergencyNewsState {
  items: EmergencyNewsItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  stateCode: string | null;
  category: string | undefined;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

const initialState: EmergencyNewsState = {
  items: [],
  page: 0,
  limit: 20,
  total: 0,
  hasMore: false,
  stateCode: null,
  category: undefined,
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

function buildQuery(state: EmergencyNewsState, page: number): EmergencyNewsQuery {
  return {
    page,
    limit: state.limit,
    category: state.category,
  };
}

export const fetchEmergencyNewsFeed = createAsyncThunk<
  Awaited<ReturnType<typeof fetchEmergencyNews>>,
  void,
  { state: RootState }
>(
  'emergencyNews/fetch',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      return await withAuthRetry(getState, dispatch, (token) =>
        fetchEmergencyNews(token, buildQuery(getState().emergencyNews, 1)),
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not load news'));
    }
  },
  {
    condition: (_, { getState }) => !getState().emergencyNews.loading,
  },
);

export const fetchMoreEmergencyNews = createAsyncThunk<
  Awaited<ReturnType<typeof fetchEmergencyNews>>,
  void,
  { state: RootState }
>('emergencyNews/fetchMore', async (_, { getState, dispatch, rejectWithValue }) => {
  const { hasMore, loadingMore, page } = getState().emergencyNews;
  if (!hasMore || loadingMore) return rejectWithValue('No more news');

  try {
    return await withAuthRetry(getState, dispatch, (token) =>
      fetchEmergencyNews(token, buildQuery(getState().emergencyNews, page + 1)),
    );
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not load more news'));
  }
});

const emergencyNewsSlice = createSlice({
  name: 'emergencyNews',
  initialState,
  reducers: {
    setEmergencyNewsCategory: (state, action: PayloadAction<string | undefined>) => {
      state.category = action.payload?.trim() || undefined;
    },
    clearEmergencyNews: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmergencyNewsFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmergencyNewsFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items ?? [];
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
        state.hasMore = action.payload.hasMore;
        state.stateCode = action.payload.stateCode ?? null;
        state.lastFetchedAt = Date.now();
        state.error = null;
      })
      .addCase(fetchEmergencyNewsFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Failed to load news';
      })
      .addCase(fetchMoreEmergencyNews.pending, (state) => {
        state.loadingMore = true;
      })
      .addCase(fetchMoreEmergencyNews.fulfilled, (state, action) => {
        state.loadingMore = false;
        const existingIds = new Set(state.items.map((item) => item.id));
        const next = (action.payload.items ?? []).filter((item) => !existingIds.has(item.id));
        state.items.push(...next);
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
        state.stateCode = action.payload.stateCode ?? state.stateCode;
      })
      .addCase(fetchMoreEmergencyNews.rejected, (state) => {
        state.loadingMore = false;
      })
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(logoutUser.rejected, () => initialState);
  },
});

export const { setEmergencyNewsCategory, clearEmergencyNews } = emergencyNewsSlice.actions;

export default emergencyNewsSlice.reducer;
