import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Storage } from 'redux-persist';

const memoryStore = new Map<string, string>();

/**
 * Wraps AsyncStorage with in-memory fallback when the native module is null
 * (Expo Go mismatch, web, or corrupted install).
 */
export const safePersistStorage: Storage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};
