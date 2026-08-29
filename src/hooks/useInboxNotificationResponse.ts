import { useEffect } from 'react';

import { DISASTER_NOTIFICATION_SCREEN } from '@/constants/disasterSurvey';
import { CITIZEN_ASSISTANCE_NOTIFICATION_SCREEN } from '@/constants/citizenActivity';
import { INBOX_NOTIFICATION_SCREEN } from '@/constants/notifications';
import { IDA_NOTIFICATION_SCREEN } from '@/constants/routes';
import {
  navigateToCitizenAssistanceIfPending,
  navigateToDisasterSurveyIfActive,
  navigateToIdaIfActive,
  navigateToNotifications,
} from '@/navigation/navigationRef';
import { markSurveyNotificationPresented } from '@/services/notification.service';
import { canUseNotifications } from '@/utils/notification-capability';

function screenFromData(data: Record<string, unknown> | undefined): string | undefined {
  const screen = data?.screen;
  return typeof screen === 'string' ? screen : undefined;
}

function presentationKeysFromData(data: Record<string, unknown> | undefined): string[] {
  if (!data) return [];
  const keys: string[] = [];
  if (typeof data.invitationId === 'string' && data.invitationId.trim()) {
    keys.push(`inv:${data.invitationId.trim()}`);
  }
  if (typeof data.activityId === 'string' && data.activityId.trim()) {
    keys.push(`activity:${data.activityId.trim()}`);
  }
  if (typeof data.inboxNotificationId === 'string' && data.inboxNotificationId.trim()) {
    keys.push(data.inboxNotificationId.trim());
  }
  return keys;
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
  if (screen === IDA_NOTIFICATION_SCREEN || notificationType === 'ida_application') {
    void navigateToIdaIfActive();
    return;
  }
  if (
    screen === CITIZEN_ASSISTANCE_NOTIFICATION_SCREEN ||
    notificationType === 'citizen_activity'
  ) {
    void navigateToCitizenAssistanceIfPending();
    return;
  }
  if (screen === INBOX_NOTIFICATION_SCREEN) {
    navigateToNotifications();
  }
}

export function useInboxNotificationResponse(): void {
  useEffect(() => {
    if (!canUseNotifications()) return;

    let responseSub: { remove: () => void } | undefined;
    let receivedSub: { remove: () => void } | undefined;
    let cancelled = false;

    void (async () => {
      const Notifications = await import('expo-notifications');
      if (cancelled) return;

      const last = await Notifications.getLastNotificationResponseAsync();
      handleNotificationNavigation(
        last?.notification.request.content.data as Record<string, unknown>,
      );

      // Remote Expo push already showed — remember it so inbox mirror won't re-alert.
      receivedSub = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as Record<string, unknown> | undefined;
        const keys = presentationKeysFromData(data);
        if (keys.length > 0) {
          void markSurveyNotificationPresented(keys);
        }
      });

      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        const keys = presentationKeysFromData(data);
        if (keys.length > 0) {
          void markSurveyNotificationPresented(keys);
        }
        handleNotificationNavigation(data);
      });
    })();

    return () => {
      cancelled = true;
      responseSub?.remove();
      receivedSub?.remove();
    };
  }, []);
}
