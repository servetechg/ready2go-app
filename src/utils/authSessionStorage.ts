import AsyncStorage from '@react-native-async-storage/async-storage';

import type { User } from '@/types/auth';

const ACCESS_KEY = 'ready2go_access_token_v1';
const REFRESH_KEY = 'ready2go_refresh_token_v1';
/** Single JSON blob — most reliable way to survive process death. */
const SESSION_KEY = 'ready2go_session_v2';

export type StoredAuthTokens = {
  token: string | null;
  refreshToken: string | null;
};

export type StoredSession = {
  token: string;
  refreshToken: string | null;
  user: User | null;
};

/** Only real JWT/string tokens — never objects. */
export function asTokenString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]') return null;
    return trimmed;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return (
      asTokenString(record.token) ||
      asTokenString(record.accessToken) ||
      asTokenString(record.refreshToken) ||
      asTokenString(record.value) ||
      asTokenString(record.jwt)
    );
  }
  return null;
}

function onlyString(value: string | null): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Save full session as one JSON string + token keys. */
export async function saveSession(input: {
  token: unknown;
  refreshToken?: unknown;
  user?: User | null;
}): Promise<void> {
  const access = onlyString(asTokenString(input.token));
  const refresh = onlyString(asTokenString(input.refreshToken));

  if (!access && !refresh) {
    await clearAuthTokens();
    return;
  }

  try {
    const ops: [string, string][] = [];
    if (access) ops.push([ACCESS_KEY, access]);
    if (refresh) ops.push([REFRESH_KEY, refresh]);

    if (access) {
      const blob: StoredSession = {
        token: access,
        refreshToken: refresh,
        user: input.user ?? null,
      };
      ops.push([SESSION_KEY, JSON.stringify(blob)]);
    }

    if (ops.length) {
      for (const [, value] of ops) {
        if (typeof value !== 'string') {
          throw new Error('Refusing non-string AsyncStorage write');
        }
      }
      await AsyncStorage.multiSet(ops);
    }

    if (!access) {
      await AsyncStorage.multiRemove([ACCESS_KEY, SESSION_KEY]);
    }
    if (!refresh) {
      await AsyncStorage.removeItem(REFRESH_KEY);
    }

    if (__DEV__) {
      console.log('[authSession] saved', {
        hasAccess: Boolean(access),
        hasRefresh: Boolean(refresh),
        hasUser: Boolean(input.user),
      });
    }
  } catch (error) {
    console.warn('[authSession] save failed', error);
  }
}

/** @deprecated Prefer saveSession — kept for call sites that only have tokens. */
export async function saveAuthTokens(
  token: unknown,
  refreshToken?: unknown,
): Promise<void> {
  await saveSession({ token, refreshToken });
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (raw && typeof raw === 'string') {
      const parsed = JSON.parse(raw) as StoredSession;
      const token = onlyString(asTokenString(parsed?.token));
      const refreshToken = onlyString(asTokenString(parsed?.refreshToken));
      if (token || refreshToken) {
        if (__DEV__) {
          console.log('[authSession] loaded blob', {
            hasAccess: Boolean(token),
            hasRefresh: Boolean(refreshToken),
            hasUser: Boolean(parsed?.user),
          });
        }
        return {
          token: token ?? '',
          refreshToken,
          user: parsed?.user ?? null,
        };
      }
    }

    // Fallback to legacy token keys
    const tokens = await loadAuthTokens();
    if (tokens.token || tokens.refreshToken) {
      if (__DEV__) {
        console.log('[authSession] loaded legacy keys', {
          hasAccess: Boolean(tokens.token),
          hasRefresh: Boolean(tokens.refreshToken),
        });
      }
      return {
        token: tokens.token ?? '',
        refreshToken: tokens.refreshToken,
        user: null,
      };
    }
    if (__DEV__) {
      console.log('[authSession] no stored session');
    }
    return null;
  } catch (error) {
    console.warn('[authSession] load failed', error);
    return null;
  }
}

export async function loadAuthTokens(): Promise<StoredAuthTokens> {
  try {
    const pairs = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
    const map = Object.fromEntries(pairs);
    return {
      token: onlyString(asTokenString(map[ACCESS_KEY])),
      refreshToken: onlyString(asTokenString(map[REFRESH_KEY])),
    };
  } catch {
    return { token: null, refreshToken: null };
  }
}

export async function clearAuthTokens(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, SESSION_KEY]);
    if (__DEV__) {
      console.log('[authSession] cleared');
    }
  } catch (error) {
    console.warn('[authSession] clear failed', error);
  }
}
