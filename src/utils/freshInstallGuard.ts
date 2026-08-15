import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearAuthTokens } from '@/utils/authSessionStorage';

/**
 * Sentinel key written on every app launch.
 * If the key is missing when the app starts, this is either the very first
 * launch or a fresh install (data was wiped). In that case we clear any
 * leftover auth tokens that Android auto-backup may have restored.
 *
 * Android auto-backup (enabled by default) preserves AsyncStorage across
 * uninstall → reinstall, which causes the old user session to reappear.
 * This guard ensures a clean slate after reinstall.
 */
const INSTALL_SENTINEL_KEY = 'ready2go_install_sentinel_v1';

/**
 * Call once at app startup, **before** session bootstrap.
 * Returns `true` if stale session data was cleared (fresh install detected).
 */
export async function guardFreshInstall(): Promise<boolean> {
  try {
    const sentinel = await AsyncStorage.getItem(INSTALL_SENTINEL_KEY);

    if (sentinel === null) {
      // First launch after install (or reinstall) — wipe any restored tokens.
      if (__DEV__) {
        console.log('[freshInstallGuard] No sentinel found — clearing stale session data');
      }
      await clearAuthTokens();
      await AsyncStorage.setItem(INSTALL_SENTINEL_KEY, Date.now().toString());
      return true;
    }

    return false;
  } catch (error) {
    console.warn('[freshInstallGuard] check failed:', error);
    // On error, write sentinel so we don't loop, but don't clear tokens
    // to avoid wiping a valid session.
    try {
      await AsyncStorage.setItem(INSTALL_SENTINEL_KEY, Date.now().toString());
    } catch {
      // best-effort
    }
    return false;
  }
}
