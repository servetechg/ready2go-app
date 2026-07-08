import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { logoutUser, refreshSession } from '@/redux/slices/authSlice';
import type { RootState } from '@/redux/store';
import { inboxNotificationService } from '@/services/inboxNotification.service';
import { isApiClientError } from '@/services/api/errors';
import type { InboxNotificationItem } from '@/types/notifications';
import { getErrorMessage } from '@/utils/error';

interface NotificationsState {
  items: InboxNotificationItem[];
  unreadCount: number;
  total: number;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  total: 0,
  loading: false,
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

export const fetchInboxNotifications = createAsyncThunk<
  Awaited<ReturnType<typeof inboxNotificationService.list>>,
  void,
  { state: RootState }
>(
  'notifications/fetchInbox',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      return await withAuthRetry(getState, dispatch, (token) =>
        inboxNotificationService.list(token, { limit: 50 }),
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not load notifications'));
    }
  },
  {
    condition: (_, { getState }) => !getState().notifications.loading,
  },
);

export const markInboxNotificationRead = createAsyncThunk<
  { id: string; unreadCount: number },
  string,
  { state: RootState }
>('notifications/markRead', async (id, { getState, dispatch, rejectWithValue }) => {
  try {
    const result = await withAuthRetry(getState, dispatch, (token) =>
      inboxNotificationService.markRead(token, id),
    );
    return { id, unreadCount: result.unreadCount };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not update notification'));
  }
});

export const markAllInboxNotificationsRead = createAsyncThunk<
  number,
  void,
  { state: RootState }
>('notifications/markAllRead', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    const result = await withAuthRetry(getState, dispatch, (token) =>
      inboxNotificationService.markAllRead(token),
    );
    return result.unreadCount;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Could not mark notifications read'));
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInboxNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInboxNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.unreadCount = action.payload.unreadCount;
        state.total = action.payload.total;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchInboxNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to load notifications';
      })
      .addCase(markInboxNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload.id);
        if (item) item.read = true;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markAllInboxNotificationsRead.fulfilled, (state, action) => {
        state.items.forEach((n) => {
          n.read = true;
        });
        state.unreadCount = action.payload;
      })
      .addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { clearNotifications } = notificationsSlice.actions;

export const selectUnreadInboxCount = (state: RootState) => state.notifications.unreadCount;

export default notificationsSlice.reducer;
