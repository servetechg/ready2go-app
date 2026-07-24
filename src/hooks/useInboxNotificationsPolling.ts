import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchInboxNotifications } from '@/redux/slices/notificationsSlice';
import { toBoolean } from '@/utils/coerce';

/** Keeps inbox unread badge fresh while the user is in the app. */
export function useInboxNotificationsPolling(): void {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const emailVerified = toBoolean(useAppSelector((s) => s.auth.user?.emailVerified));

  useEffect(() => {
    if (!isAuthenticated || !emailVerified) return;

    void dispatch(fetchInboxNotifications());

    const interval = setInterval(() => {
      void dispatch(fetchInboxNotifications());
    }, 45_000);

    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated, emailVerified]);
}
