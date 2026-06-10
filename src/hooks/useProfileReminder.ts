import { useEffect } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { toBoolean } from '@/utils/coerce';
import { notificationService } from '@/services/notification.service';

/**
 * Custom hook to manage the lifecycle of the profile incomplete reminder notification.
 * - Schedules/reschedules a notification if user is registered but profile is incomplete.
 * - Postpones the notification when the user moves between onboarding steps.
 * - Cancels the notification if the profile is completed or the user is logged out.
 */
export function useProfileReminder() {
  const user = useAppSelector((s) => s.auth.user);
  const pendingAuth = useAppSelector((s) => s.auth.pendingAuth);

  const activeUser = user || pendingAuth?.user;
  const isProfileComplete = toBoolean(activeUser?.profileComplete);

  const needsReminder = !!activeUser && !isProfileComplete;

  // Track current step of onboarding to postpone reminder while actively filling profile details
  const currentStep = useAppSelector((s) => s.registration.currentStep);

  useEffect(() => {
    if (needsReminder) {
      // Schedule reminder for 1 hour (3600 seconds).
      // Since it uses a fixed ID, each call overwrites the previous trigger, resetting the countdown.
      notificationService.scheduleProfileReminder(3600);
    } else {
      // Cancel the reminder once profile is complete or user is logged out
      notificationService.cancelProfileReminder();
    }
  }, [needsReminder, currentStep]);
}
