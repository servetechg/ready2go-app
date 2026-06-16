import { useEffect } from 'react';

import { DISASTER_NOTIFICATION_SCREEN } from '@/constants/disasterSurvey';
import { navigateToDisasterSurveyIntro } from '@/navigation/navigationRef';
import { canUseNotifications } from '@/utils/notification-capability';

function isDisasterSurveyNotification(data: Record<string, unknown> | undefined): boolean {
  return data?.screen === DISASTER_NOTIFICATION_SCREEN;
}

export function useDisasterNotificationResponse(): void {
  useEffect(() => {
    if (!canUseNotifications()) return;

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    void (async () => {
      const Notifications = await import('expo-notifications');
      if (cancelled) return;

      const last = await Notifications.getLastNotificationResponseAsync();
      if (isDisasterSurveyNotification(last?.notification.request.content.data as Record<string, unknown>)) {
        navigateToDisasterSurveyIntro();
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        if (
          isDisasterSurveyNotification(
            response.notification.request.content.data as Record<string, unknown>,
          )
        ) {
          navigateToDisasterSurveyIntro();
        }
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);
}
