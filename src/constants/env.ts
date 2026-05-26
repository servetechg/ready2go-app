export const ENV = {
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (__DEV__
      ? 'http://localhost:3000/api/v1'
      : 'https://earthquickalert.vercel.app/api/v1'),
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  IS_DEV: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') === 'development',
} as const;
