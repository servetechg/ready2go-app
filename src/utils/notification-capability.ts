import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** True when expo-notifications can be used (dev build, standalone, or bare — not Expo Go). */
export function canUseNotifications(): boolean {
  if (Platform.OS === 'web') return false;
  // SDK 53+ removed push/local notification support in Expo Go (especially Android).
  return Constants.executionEnvironment !== 'storeClient';
}

export function getNotificationLimitationReason(): string | null {
  if (Platform.OS === 'web') {
    return 'Notifications are not available on web.';
  }
  if (Constants.executionEnvironment === 'storeClient') {
    return 'Notifications require a development build. Expo Go does not support them in SDK 53+.';
  }
  return null;
}
