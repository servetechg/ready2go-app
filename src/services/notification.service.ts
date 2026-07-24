import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { getProfileReminderDelaySeconds } from '@/utils/profileReminderDelay';
import {
  clearStoredProfileReminder,
  loadStoredProfileReminder,
  saveStoredProfileReminder,
} from '@/utils/profileReminderStorage';
import {
  canUseNotifications,
} from '@/utils/notification-capability';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let handlerInitialized = false;
let scheduleLock: Promise<void> = Promise.resolve();

function withScheduleLock<T>(task: () => Promise<T>): Promise<T> {
  const run = scheduleLock.then(task);
  scheduleLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!canUseNotifications()) return null;
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }
  return notificationsModule;
}

export function isNotificationsAvailable(): boolean {
  return canUseNotifications();
}

/** Set up foreground notification display (dev build / standalone only). */
export async function initNotificationHandler(): Promise<void> {
  if (!canUseNotifications() || handlerInitialized) return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerInitialized = true;
}

export const PROFILE_REMINDER_ID = 'profile-incomplete-reminder';
export const PROFILE_REMINDER_CHANNEL_ID = 'profile-reminders';
export const DISASTER_SURVEY_CHANNEL_ID = 'disaster-alerts';
export const INBOX_CHANNEL_ID = 'inbox-updates';

export const notificationService = {
  async requestPermissionsAsync(): Promise<boolean> {
    if (!canUseNotifications()) return false;

    const Notifications = await getNotifications();
    if (!Notifications) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      await Notifications.setNotificationChannelAsync(PROFILE_REMINDER_CHANNEL_ID, {
        name: 'Profile reminders',
        description: 'Reminders to complete your Ready2Go emergency profile',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1B4F8A',
        sound: 'default',
        bypassDnd: false,
      });
      await Notifications.setNotificationChannelAsync(DISASTER_SURVEY_CHANNEL_ID, {
        name: 'Disaster alerts',
        description: 'Emergency disaster zone alerts and relief surveys',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C62828',
        sound: 'default',
        bypassDnd: true,
      });
      await Notifications.setNotificationChannelAsync(INBOX_CHANNEL_ID, {
        name: 'Account updates',
        description: 'Report status, surveys, and Ready2Go updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 200, 200],
        lightColor: '#33375D',
        sound: 'default',
      });
    }

    if (!Device.isDevice) {
      return true;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  async getExpoPushTokenAsync(): Promise<string | null> {
    if (!canUseNotifications() || !Device.isDevice) {
      return null;
    }

    const Notifications = await getNotifications();
    if (!Notifications) return null;

    try {
      const hasPermission = await this.requestPermissionsAsync();
      if (!hasPermission) {
        return null;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.warn('Failed to get Expo push token:', error);
      return null;
    }
  },

  async scheduleProfileReminder(
    delaySeconds: number = 3600,
    userId?: string,
  ): Promise<string | null> {
    return withScheduleLock(async () => {
      if (!canUseNotifications()) return null;

      const Notifications = await getNotifications();
      if (!Notifications) return null;

      try {
        const hasPermission = await this.requestPermissionsAsync();
        if (!hasPermission) {
          return null;
        }

        const seconds = Math.max(10, Math.floor(delaySeconds));
        const fireAt = new Date(Date.now() + seconds * 1000);

        await Notifications.cancelScheduledNotificationAsync(PROFILE_REMINDER_ID);

        const id = await Notifications.scheduleNotificationAsync({
          identifier: PROFILE_REMINDER_ID,
          content: {
            title: 'Complete your profile 🚨',
            body: 'Complete your profile to ensure we can help you when needed.',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            ...(Platform.OS === 'android'
              ? { channelId: PROFILE_REMINDER_CHANNEL_ID }
              : {}),
            data: { screen: 'Onboarding' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireAt,
            channelId: PROFILE_REMINDER_CHANNEL_ID,
          },
        });

        if (userId) {
          await saveStoredProfileReminder({ userId, fireAtMs: fireAt.getTime() });
        }

        return id;
      } catch (error) {
        console.warn('Failed to schedule profile reminder:', error);
        return null;
      }
    });
  },

  /**
   * Idempotent scheduler — skips if a valid reminder is already queued for this user.
   */
  async ensureProfileReminder(
    userId: string,
    signupAt?: string,
  ): Promise<{ scheduled: boolean; permissionGranted: boolean; alreadyScheduled: boolean }> {
    if (!canUseNotifications()) {
      return { scheduled: false, permissionGranted: false, alreadyScheduled: false };
    }

    const hasPermission = await this.requestPermissionsAsync();
    if (!hasPermission) {
      return { scheduled: false, permissionGranted: false, alreadyScheduled: false };
    }

    const delaySeconds = getProfileReminderDelaySeconds(signupAt);
    const expectedFireAt = Date.now() + delaySeconds * 1000;

    const stored = await loadStoredProfileReminder();
    if (stored?.userId === userId && stored.fireAtMs > Date.now() + 5000) {
      const Notifications = await getNotifications();
      if (Notifications) {
        const pending = await Notifications.getAllScheduledNotificationsAsync();
        const exists = pending.some((n) => n.identifier === PROFILE_REMINDER_ID);
        if (exists) {
          return { scheduled: true, permissionGranted: true, alreadyScheduled: true };
        }
      }
    }

    const id = await this.scheduleProfileReminder(delaySeconds, userId);
    const scheduled = Boolean(id);

    if (scheduled && Math.abs(expectedFireAt - (stored?.fireAtMs ?? 0)) > 5000) {
      await saveStoredProfileReminder({ userId, fireAtMs: expectedFireAt });
    }

    return { scheduled, permissionGranted: true, alreadyScheduled: false };
  },

  async setupProfileReminderAfterSignup(
    userId: string,
    signupAt?: string,
  ): Promise<{ scheduled: boolean; permissionGranted: boolean }> {
    const result = await this.ensureProfileReminder(userId, signupAt);
    return {
      scheduled: result.scheduled,
      permissionGranted: result.permissionGranted,
    };
  },

  async cancelProfileReminder(): Promise<void> {
    if (!canUseNotifications()) return;

    const Notifications = await getNotifications();
    if (!Notifications) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(PROFILE_REMINDER_ID);
      await clearStoredProfileReminder();
    } catch (error) {
      console.warn('Failed to cancel profile reminder:', error);
    }
  },
};
