import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_STORAGE_KEY = '@ready2go/profile-reminder-scheduled';

export type StoredProfileReminder = {
  userId: string;
  fireAtMs: number;
};

export async function loadStoredProfileReminder(): Promise<StoredProfileReminder | null> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredProfileReminder;
    if (!parsed?.userId || !parsed?.fireAtMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveStoredProfileReminder(data: StoredProfileReminder): Promise<void> {
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(data));
}

export async function clearStoredProfileReminder(): Promise<void> {
  await AsyncStorage.removeItem(REMINDER_STORAGE_KEY);
}
