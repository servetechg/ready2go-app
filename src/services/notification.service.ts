import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { DISASTER_NOTIFICATION_SCREEN } from '@/constants/disasterSurvey';
import { getProfileReminderDelaySeconds } from '@/utils/profileReminderDelay';
import {
  clearStoredProfileReminder,
  loadStoredProfileReminder,
  saveStoredProfileReminder,
} from '@/utils/profileReminderStorage';
import { canUseNotifications } from '@/utils/notification-capability';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let handlerInitialized = false;
let scheduleLock: Promise<void> = Promise.resolve();

const PRESENTED_INBOX_PUSH_KEY = '@ready2go/presented-inbox-push-ids';
const HAS_EXPO_PUSH_TOKEN_KEY = '@ready2go/has-expo-push-token';

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

async function ensureAndroidChannels(
  Notifications: NotificationsModule,
): Promise<void> {
  if (Platform.OS !== 'android') return;

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

async function loadPresentedInboxPushIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(PRESENTED_INBOX_PUSH_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

async function savePresentedInboxPushIds(ids: Set<string>): Promise<void> {
  // Keep bounded so storage does not grow forever.
  const trimmed = [...ids].slice(-200);
  await AsyncStorage.setItem(PRESENTED_INBOX_PUSH_KEY, JSON.stringify(trimmed));
}

export async function markExpoPushTokenRegistered(registered: boolean): Promise<void> {
  if (registered) {
    await AsyncStorage.setItem(HAS_EXPO_PUSH_TOKEN_KEY, '1');
  } else {
    await AsyncStorage.removeItem(HAS_EXPO_PUSH_TOKEN_KEY);
  }
}

export async function hasRegisteredExpoPushToken(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(HAS_EXPO_PUSH_TOKEN_KEY)) === '1';
  } catch {
    return false;
  }
}

/** Remember that a survey was already announced (remote or local) so we never double-notify. */
export async function markSurveyNotificationPresented(keys: string[]): Promise<void> {
  const clean = keys.map((k) => k.trim()).filter(Boolean);
  if (clean.length === 0) return;
  const presented = await loadPresentedInboxPushIds();
  for (const key of clean) presented.add(key);
  await savePresentedInboxPushIds(presented);
}

export const notificationService = {
  async requestPermissionsAsync(): Promise<boolean> {
    if (!canUseNotifications()) return false;

    const Notifications = await getNotifications();
    if (!Notifications) return false;

    // Android 13+: channel must exist before the permission prompt / token fetch.
    await ensureAndroidChannels(Notifications);

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
        console.warn('[push] notification permission not granted');
        return null;
      }

      const projectId =
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      if (!projectId || typeof projectId !== 'string') {
        console.warn('[push] missing EAS projectId — cannot get Expo push token');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return token.data;
    } catch (error) {
      // Common on Android builds without FCM / google-services.json configured.
      console.warn('Failed to get Expo push token:', error);
      return null;
    }
  },

  /**
   * Fallback only: when remote Expo push is unavailable, mirror unread survey
   * inbox rows as a single local OS notification. Skipped if a push token is
   * registered (remote push already delivered the banner).
   */
  async presentInboxSurveyIfNeeded(items: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    meta?: Record<string, unknown>;
  }>): Promise<number> {
    if (!canUseNotifications()) return 0;

    // Remote Expo push already showed the OS banner — do not mirror again on open.
    if (await hasRegisteredExpoPushToken()) {
      return 0;
    }
    // Race-safe: token may exist before the registration flag is written.
    const liveToken = await this.getExpoPushTokenAsync();
    if (liveToken) {
      await markExpoPushTokenRegistered(true);
      return 0;
    }

    const Notifications = await getNotifications();
    if (!Notifications) return 0;

    const hasPermission = await this.requestPermissionsAsync();
    if (!hasPermission) return 0;

    const presented = await loadPresentedInboxPushIds();
    let shown = 0;

    for (const item of items) {
      if (item.read) continue;
      if (item.type !== 'disaster_survey') continue;

      const invitationId =
        typeof item.meta?.invitationId === 'string' ? item.meta.invitationId : '';
      const keys = [item.id, invitationId ? `inv:${invitationId}` : ''].filter(Boolean);
      if (keys.some((k) => presented.has(k))) continue;

      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `inbox-disaster-survey-${item.id}`,
          content: {
            title: item.title || 'Disaster relief survey',
            body:
              item.body ||
              'You may be eligible for disaster relief. Tap to complete your status survey.',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            ...(Platform.OS === 'android'
              ? { channelId: DISASTER_SURVEY_CHANNEL_ID }
              : {}),
            data: {
              screen: DISASTER_NOTIFICATION_SCREEN,
              notificationType: 'disaster_survey',
              inboxNotificationId: item.id,
              ...(invitationId ? { invitationId } : {}),
            },
          },
          trigger: null,
        });
        for (const key of keys) presented.add(key);
        shown += 1;
      } catch (error) {
        console.warn('[push] failed to present local survey notification:', error);
      }
    }

    if (shown > 0) {
      await savePresentedInboxPushIds(presented);
    }
    return shown;
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

    const stored = await loadStoredProfileReminder();
    if (stored?.userId === userId && stored.fireAtMs > Date.now() + 5000) {
      return { scheduled: false, permissionGranted: true, alreadyScheduled: true };
    }

    const id = await this.scheduleProfileReminder(delaySeconds, userId);
    return {
      scheduled: Boolean(id),
      permissionGranted: true,
      alreadyScheduled: false,
    };
  },

  async cancelProfileReminder(): Promise<void> {
    if (!canUseNotifications()) return;
    const Notifications = await getNotifications();
    if (!Notifications) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(PROFILE_REMINDER_ID);
      await clearStoredProfileReminder();
    } catch {
      // ignore
    }
  },
};
