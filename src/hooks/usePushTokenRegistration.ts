import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAppSelector } from '@/redux/hooks';
import { toBoolean } from '@/utils/coerce';
import {
  isNotificationsAvailable,
  markExpoPushTokenRegistered,
  notificationService,
} from '@/services/notification.service';
import { profileService } from '@/services/profile.service';

/**
 * Registers the device Expo push token after login.
 * Retries on app foreground — survey remote push requires this token in MongoDB.
 */
export function usePushTokenRegistration() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const lastRegistered = useRef<string | null>(null);
  const inFlight = useRef(false);

  const emailVerified = toBoolean(user?.emailVerified);

  useEffect(() => {
    if (!token || !user || !emailVerified) {
      lastRegistered.current = null;
      return;
    }

    if (!isNotificationsAvailable()) {
      return;
    }

    let cancelled = false;

    const register = async (reason: string) => {
      if (cancelled || inFlight.current) return;
      inFlight.current = true;
      try {
        const pushToken = await notificationService.getExpoPushTokenAsync();
        if (!pushToken || cancelled) return;
        if (lastRegistered.current === pushToken) return;

        await profileService.registerPushToken(token, pushToken);
        lastRegistered.current = pushToken;
        await markExpoPushTokenRegistered(true);
        if (__DEV__) {
          console.log(`[push] token registered (${reason})`);
        }
      } catch (err) {
        // Allow a later retry (e.g. after permission grant / app resume).
        lastRegistered.current = null;
        await markExpoPushTokenRegistered(false);
        console.warn('[push] token registration failed:', err);
      } finally {
        inFlight.current = false;
      }
    };

    void register('mount');

    // Retry shortly after mount — first attempt often races permission UI.
    const retryTimer = setTimeout(() => {
      void register('retry');
    }, 4000);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void register('foreground');
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      sub.remove();
    };
  }, [token, user?.id, emailVerified]);
}
