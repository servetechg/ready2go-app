import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCurrentUser } from '@/redux/slices/authSlice';
import { flushPersistedState } from '@/redux/persistFlush';
import { sanitizeRegistration } from '@/redux/slices/registrationSlice';

/**
 * After redux-persist rehydrates (and on foreground), restore the session.
 * Tokens stay on disk until manual logout — never clear on background/kill.
 */
export function useSessionBootstrap() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const lastSyncedToken = useRef<string | null>(null);
  const syncInFlight = useRef(false);

  useEffect(() => {
    if (!token && !refreshToken) {
      lastSyncedToken.current = null;
      return;
    }

    const sync = async (force = false) => {
      if (syncInFlight.current) return;
      if (!force && token && lastSyncedToken.current === token) return;

      syncInFlight.current = true;
      try {
        if (token) lastSyncedToken.current = token;
        dispatch(sanitizeRegistration());
        await dispatch(fetchCurrentUser());
        await flushPersistedState();
      } finally {
        syncInFlight.current = false;
      }
    };

    void sync(false);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void sync(true);
      } else if (state === 'background' || state === 'inactive') {
        // Ensure tokens are on disk before the OS may kill the process.
        void flushPersistedState();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [dispatch, token, refreshToken]);
}
