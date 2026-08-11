import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as
  | { googleMapsApiKey?: string; profileReminderSeconds?: number }
  | undefined;

/** Mobile JS bundle reads EXPO_PUBLIC_*; native map reads app.config.js extra. */
function resolveGoogleMapsApiKey(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    extra?.googleMapsApiKey?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    ''
  );
}

function resolveGeoapifyApiKey(): string {
  return (
    process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY?.trim() ||
    '9abe9caf7f5943d189e9ef564c5cdec7'
  );
}

function parsePositiveInt(raw: string | number | undefined, fallback: number): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Default 30 minutes — override with EXPO_PUBLIC_PROFILE_REMINDER_SECONDS for testing (e.g. 60). */
const PROFILE_REMINDER_SECONDS = parsePositiveInt(
  process.env.EXPO_PUBLIC_PROFILE_REMINDER_SECONDS ?? extra?.profileReminderSeconds,
  30 * 60,
);

export const ENV = {
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (__DEV__
      ? 'http://localhost:3000/api/v1'
      : 'https://earthquickalert.vercel.app/api/v1'),
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  IS_DEV: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') === 'development',
  GOOGLE_MAPS_API_KEY: resolveGoogleMapsApiKey(),
  GEOAPIFY_API_KEY: resolveGeoapifyApiKey(),
  PROFILE_REMINDER_SECONDS,
} as const;

