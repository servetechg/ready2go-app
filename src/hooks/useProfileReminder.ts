import { useEffect } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { toBoolean } from '@/utils/coerce';
import { notificationService } from '@/services/notification.service';
import { getProfileReminderDelaySeconds } from '@/utils/profileReminderDelay';

/**
 * Schedules a local push when the user signed up but has not finished onboarding.
 * Delay is anchored to signup time (EXPO_PUBLIC_PROFILE_REMINDER_SECONDS, default 30 min).
 */
export function useProfileReminder() {
  const user = useAppSelector((s) => s.auth.user);
  const pendingAuth = useAppSelector((s) => s.auth.pendingAuth);

  const activeUser = user || pendingAuth?.user;
  const isProfileComplete = toBoolean(activeUser?.profileComplete);

  const needsReminder = !!activeUser && !isProfileComplete;

  useEffect(() => {
    if (!needsReminder) {
      void notificationService.cancelProfileReminder();
      return;
    }

    const delaySeconds = getProfileReminderDelaySeconds(activeUser?.createdAt);
    void notificationService.scheduleProfileReminder(delaySeconds);
  }, [needsReminder, activeUser?.id, activeUser?.createdAt]);
}
