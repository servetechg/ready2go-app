import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined;

/** Mobile JS bundle reads EXPO_PUBLIC_*; native map reads app.config.js extra. */
function resolveGoogleMapsApiKey(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    extra?.googleMapsApiKey?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    ''
  );
}

export const ENV = {
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (__DEV__
      ? 'http://localhost:3000/api/v1'
      : 'https://earthquickalert.vercel.app/api/v1'),
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  IS_DEV: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') === 'development',
  GOOGLE_MAPS_API_KEY: resolveGoogleMapsApiKey(),
} as const;
