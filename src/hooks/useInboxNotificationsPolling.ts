import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchInboxNotifications } from '@/redux/slices/notificationsSlice';
import { notificationService } from '@/services/notification.service';
import { toBoolean } from '@/utils/coerce';

const POLL_MS = 20_000;

/**
 * Keeps inbox unread badge fresh and mirrors new disaster-survey inbox items
 * into OS local notifications (works even when Expo remote push token is missing).
 */
export function useInboxNotificationsPolling(): void {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const emailVerified = toBoolean(useAppSelector((s) => s.auth.user?.emailVerified));
  const items = useAppSelector((s) => s.notifications.items);
  const lastFetchedAt = useAppSelector((s) => s.notifications.lastFetchedAt);
  const mirroredForFetch = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !emailVerified) return;

    const refresh = () => {
      void dispatch(fetchInboxNotifications());
    };

    refresh();
    const interval = setInterval(refresh, POLL_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') refresh();
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [dispatch, isAuthenticated, emailVerified]);

  useEffect(() => {
    if (!lastFetchedAt || mirroredForFetch.current === lastFetchedAt) return;
    mirroredForFetch.current = lastFetchedAt;

    void notificationService.presentInboxSurveyIfNeeded(
      items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        read: item.read,
        meta: item.meta,
      })),
    );
  }, [items, lastFetchedAt]);
}
