import { useEffect, useRef } from 'react';

import { useAppSelector } from '@/redux/hooks';
import { toBoolean } from '@/utils/coerce';
import {
  isNotificationsAvailable,
  notificationService,
} from '@/services/notification.service';
import { profileService } from '@/services/profile.service';

/**
 * Registers the device Expo push token after email OTP verification.
 * Enables server-side push (profile reminder cron, test push, future alerts).
 */
export function usePushTokenRegistration() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const lastRegistered = useRef<string | null>(null);

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

    void (async () => {
      const pushToken = await notificationService.getExpoPushTokenAsync();
      if (!pushToken || cancelled) return;
      if (lastRegistered.current === pushToken) return;

      try {
        await profileService.registerPushToken(token, pushToken);
        lastRegistered.current = pushToken;
      } catch {
        // Non-blocking — local scheduled notification still works.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, user?.id, emailVerified]);
}
