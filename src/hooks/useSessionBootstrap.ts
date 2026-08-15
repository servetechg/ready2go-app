import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchCurrentUser,
  hydrateTokens,
  setCredentials,
  setSessionReady,
} from '@/redux/slices/authSlice';
import { flushPersistedState } from '@/redux/persistFlush';
import { sanitizeRegistration } from '@/redux/slices/registrationSlice';
import {
  asTokenString,
  loadSession,
  saveSession,
} from '@/utils/authSessionStorage';
import { guardFreshInstall } from '@/utils/freshInstallGuard';

/**
 * Restore session from disk once, then softly validate.
 * Never leave sessionReady=false (that stuck the app on a spinner).
 */
export function useSessionBootstrap() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth?.token ?? null);
  const refreshToken = useAppSelector((s) => s.auth?.refreshToken ?? null);
  const user = useAppSelector((s) => s.auth?.user ?? null);

  const tokenRef = useRef(token);
  const refreshRef = useRef(refreshToken);
  const userRef = useRef(user);
  tokenRef.current = token;
  refreshRef.current = refreshToken;
  userRef.current = user;

  const lastSyncedToken = useRef<string | null>(null);
  const syncInFlight = useRef(false);
  const didRestore = useRef(false);

  useEffect(() => {
    let alive = true;

    const sync = async (force = false) => {
      if (syncInFlight.current) return;
      syncInFlight.current = true;

      try {
        let access = asTokenString(tokenRef.current);
        let refresh = asTokenString(refreshRef.current);

        if (!didRestore.current) {
          didRestore.current = true;

          // Detect fresh install and clear any stale session data
          // that Android auto-backup may have restored.
          const wasFreshInstall = await guardFreshInstall();
          if (!alive) return;

          const stored = wasFreshInstall ? null : await loadSession();
          if (!alive) return;

          if (stored && (stored.token || stored.refreshToken)) {
            access = asTokenString(stored.token) ?? access;
            refresh = asTokenString(stored.refreshToken) ?? refresh;

            const verified =
              stored.user &&
              (stored.user.emailVerified === true ||
                String(stored.user.emailVerified).toLowerCase() === 'true');

            if (stored.user && access && verified) {
              dispatch(
                setCredentials({
                  user: stored.user,
                  token: access,
                  refreshToken: refresh ?? undefined,
                }),
              );
            } else if (access || refresh) {
              // Skip hydrating unverified / orphan sessions — Login should show.
              if (!verified && stored.user) {
                access = null;
                refresh = null;
              } else if (!stored.user) {
                dispatch(
                  hydrateTokens({
                    token: access,
                    refreshToken: refresh,
                    replace: true,
                  }),
                );
              }
            }

            if (__DEV__) {
              console.log('[session] restored from disk', {
                hasAccess: Boolean(access),
                hasRefresh: Boolean(refresh),
                hasUser: Boolean(stored.user),
                verified: Boolean(verified),
              });
            }
          }
        }

        if (!access && !refresh) {
          lastSyncedToken.current = null;
          return;
        }

        if (!force && access && lastSyncedToken.current === access) {
          return;
        }

        dispatch(sanitizeRegistration());

        if (access) {
          lastSyncedToken.current = access;
          const result = await dispatch(fetchCurrentUser(access));
          if (!alive) return;

          if (fetchCurrentUser.fulfilled.match(result)) {
            await saveSession({
              token: access,
              refreshToken: refresh,
              user: result.payload.user,
            });
          } else if (__DEV__) {
            console.warn(
              '[session] profile sync failed (keeping local session)',
              result.payload,
            );
          }
        }

        await flushPersistedState();
        await saveSession({
          token: asTokenString(tokenRef.current) ?? access,
          refreshToken: asTokenString(refreshRef.current) ?? refresh,
          user: userRef.current,
        });
      } finally {
        syncInFlight.current = false;
        // Always release the loading gate — even if this run was superseded.
        dispatch(setSessionReady(true));
      }
    };

    void sync(false);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void sync(true);
      } else if (state === 'background' || state === 'inactive') {
        void flushPersistedState();
        void saveSession({
          token: asTokenString(tokenRef.current),
          refreshToken: asTokenString(refreshRef.current),
          user: userRef.current,
        });
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      alive = false;
      sub.remove();
    };
    // Mount once — token/user changes are read via refs (avoids spinner loops).
  }, [dispatch]);
}
