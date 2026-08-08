import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Storage } from 'redux-persist';

const memoryStore = new Map<string, string>();

async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/**
 * AsyncStorage-backed redux-persist storage.
 * Writes never silently succeed in memory-only mode — that loses sessions on kill.
 */
export const safePersistStorage: Storage = {
  getItem: async (key) => {
    try {
      return await withRetry(() => AsyncStorage.getItem(key));
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: async (key, value) => {
    try {
      await withRetry(() => AsyncStorage.setItem(key, value));
      memoryStore.set(key, value);
    } catch (error) {
      console.warn('[persistStorage] AsyncStorage.setItem failed:', key, error);
      throw error;
    }
  },
  removeItem: async (key) => {
    try {
      await withRetry(() => AsyncStorage.removeItem(key));
      memoryStore.delete(key);
    } catch (error) {
      memoryStore.delete(key);
      console.warn('[persistStorage] AsyncStorage.removeItem failed:', key, error);
      throw error;
    }
  },
};
