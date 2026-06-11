import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import {
  canUseNotifications,
  getNotificationLimitationReason,
} from '@/utils/notification-capability';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let handlerInitialized = false;

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

export function getNotificationsUnavailableReason(): string | null {
  return getNotificationLimitationReason();
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

export const notificationService = {
  /**
   * Request user permission for push notifications and register Android channels.
   * Returns true if permission is granted, false otherwise.
   */
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
    }

    if (!Device.isDevice) {
      if (__DEV__) {
        console.warn(
          'Push notification permissions check skipped: use a physical device or custom build.',
        );
      }
      return true;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  /**
   * Retrieves the Expo Push Token (for remote notifications).
   * Safe to call on simulator (returns null).
   */
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
      if (__DEV__) {
        console.error('Failed to get Expo push token:', error);
      }
      return null;
    }
  },

  /**
   * Schedule the local profile completion reminder.
   * Uses a fixed identifier so rescheduling resets the timer.
   */
  async scheduleProfileReminder(delaySeconds: number = 3600): Promise<string | null> {
    if (!canUseNotifications()) return null;

    const Notifications = await getNotifications();
    if (!Notifications) return null;

    try {
      const hasPermission = await this.requestPermissionsAsync();
      if (!hasPermission) {
        return null;
      }

      const id = await Notifications.scheduleNotificationAsync({
        identifier: PROFILE_REMINDER_ID,
        content: {
          title: 'Complete your profile 🚨',
          body: 'Complete your profile to ensure we can help you when needed.',
          sound: true,
          data: { screen: 'Onboarding' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
          repeats: false,
        } as Notifications.TimeIntervalTriggerInput,
      });

      return id;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to schedule profile reminder:', error);
      }
      return null;
    }
  },

  /** Cancel the profile reminder notification if one exists. */
  async cancelProfileReminder(): Promise<void> {
    if (!canUseNotifications()) return;

    const Notifications = await getNotifications();
    if (!Notifications) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(PROFILE_REMINDER_ID);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to cancel profile reminder:', error);
      }
    }
  },

  /** Send an immediate test notification for developer verification. */
  async sendImmediateTestNotification(): Promise<string | null> {
    if (!canUseNotifications()) return null;

    const Notifications = await getNotifications();
    if (!Notifications) return null;

    try {
      const hasPermission = await this.requestPermissionsAsync();
      if (!hasPermission) {
        return null;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ready2Go Test Notification 📬',
          body: 'This is a test notification. Complete your profile to ensure we can help you when needed.',
          sound: true,
        },
        trigger: null,
      });

      return id;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to send immediate notification:', error);
      }
      return null;
    }
  },
};
