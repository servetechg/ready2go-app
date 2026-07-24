import { useEffect } from 'react';

import { DISASTER_NOTIFICATION_SCREEN } from '@/constants/disasterSurvey';
import { INBOX_NOTIFICATION_SCREEN } from '@/constants/notifications';
import {
  navigateToDisasterSurveyIfActive,
  navigateToNotifications,
} from '@/navigation/navigationRef';
import { canUseNotifications } from '@/utils/notification-capability';

function screenFromData(data: Record<string, unknown> | undefined): string | undefined {
  const screen = data?.screen;
  return typeof screen === 'string' ? screen : undefined;
}

function handleNotificationNavigation(data: Record<string, unknown> | undefined): void {
  if (!data) return;

  const screen = screenFromData(data);
  const notificationType =
    typeof data.notificationType === 'string' ? data.notificationType : undefined;

  if (screen === DISASTER_NOTIFICATION_SCREEN || notificationType === 'disaster_survey') {
    void navigateToDisasterSurveyIfActive();
    return;
  }
  if (screen === INBOX_NOTIFICATION_SCREEN) {
    navigateToNotifications();
  }
}

export function useInboxNotificationResponse(): void {
  useEffect(() => {
    if (!canUseNotifications()) return;

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    void (async () => {
      const Notifications = await import('expo-notifications');
      if (cancelled) return;

      const last = await Notifications.getLastNotificationResponseAsync();
      handleNotificationNavigation(
        last?.notification.request.content.data as Record<string, unknown>,
      );

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationNavigation(
          response.notification.request.content.data as Record<string, unknown>,
        );
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);
}
