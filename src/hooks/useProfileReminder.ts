import { useEffect, useRef } from 'react';

import { useAppSelector } from '@/redux/hooks';
import { toBoolean } from '@/utils/coerce';
import { notificationService } from '@/services/notification.service';

/**
 * Schedules the incomplete-profile reminder only after email OTP verification.
 * Does not run during signup / pending-auth (pre-OTP) flow.
 */
export function useProfileReminder() {
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const ensuredForUser = useRef<string | null>(null);

  const emailVerified = toBoolean(user?.emailVerified);
  const isProfileComplete = toBoolean(user?.profileComplete);

  const needsReminder =
    isAuthenticated && !!user?.id && emailVerified && !isProfileComplete;

  useEffect(() => {
    if (!needsReminder || !user?.id) {
      ensuredForUser.current = null;
      if (!emailVerified || isProfileComplete) {
        void notificationService.cancelProfileReminder();
      }
      return;
    }

    if (ensuredForUser.current === user.id) {
      return;
    }

    ensuredForUser.current = user.id;

    void notificationService.ensureProfileReminder(user.id, user.createdAt);
  }, [needsReminder, user?.id, user?.createdAt, emailVerified, isProfileComplete]);
}
