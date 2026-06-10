import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Set up the foreground notification handler
export function initNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const PROFILE_REMINDER_ID = 'profile-incomplete-reminder';

export const notificationService = {
  /**
   * Request user permission for push notifications and register Android channels.
   * Returns true if permission is granted, false otherwise.
   */
  async requestPermissionsAsync(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    // Android requires a notification channel to display notifications
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (!Device.isDevice) {
      console.warn('Push notification permissions check skipped: Must run on physical device or custom build.');
      // Return true in development to allow testing local notifications
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
    if (Platform.OS === 'web' || !Device.isDevice) {
      return null;
    }

    try {
      const hasPermission = await this.requestPermissionsAsync();
      if (!hasPermission) {
        return null;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Failed to get Expo push token:', error);
      return null;
    }
  },

  /**
   * Schedule the local profile completion reminder.
   * If a notification with the same identifier is already scheduled, it is updated (effectively resetting the timer).
   * @param delaySeconds The delay in seconds before triggering (default 1 hour = 3600 seconds)
   */
  async scheduleProfileReminder(delaySeconds: number = 3600): Promise<string | null> {
    try {
      // First ensure we have permissions
      const hasPermission = await this.requestPermissionsAsync();
      if (!hasPermission) {
        console.warn('Permissions not granted for notifications. Skipping scheduling.');
        return null;
      }

      // Schedule the notification with the fixed identifier
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

      console.log(`Scheduled profile completion reminder for ${delaySeconds} seconds. ID: ${id}`);
      return id;
    } catch (error) {
      console.error('Failed to schedule profile reminder:', error);
      return null;
    }
  },

  /**
   * Cancel the profile reminder notification if it has been scheduled.
   */
  async cancelProfileReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(PROFILE_REMINDER_ID);
      console.log('Cancelled profile incomplete reminder notification.');
    } catch (error) {
      console.error('Failed to cancel profile reminder:', error);
    }
  },

  /**
   * Send an immediate test notification for developer verification.
   */
  async sendImmediateTestNotification(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissionsAsync();
      if (!hasPermission) {
        console.warn('Permissions not granted for notifications. Skipping test notification.');
        return null;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ready2Go Test Notification 📬',
          body: 'This is a test notification. Complete your profile to ensure we can help you when needed.',
          sound: true,
        },
        trigger: null, // null triggers immediately
      });

      console.log(`Sent immediate test notification. ID: ${id}`);
      return id;
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
      return null;
    }
  },
};
