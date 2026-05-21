export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.ready2go.example.com',
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  IS_DEV: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') === 'development',
} as const;
