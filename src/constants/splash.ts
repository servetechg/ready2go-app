/**
 * Keep in sync with app.json → expo-splash-screen plugin.
 * Android uses a square padded asset — wide logo1.png clips on Android 12+ APK splash.
 */
export const NATIVE_SPLASH_CONFIG = {
  backgroundColor: '#1B4F8A',
  resizeMode: 'contain' as const,
};

/** Wide wordmark — iOS / in-app preview default */
export const NATIVE_SPLASH_IOS = {
  image: require('@/assets/images/logo1.png'),
  imageWidth: 200,
  aspect: 1044 / 786,
};

/** Square padded asset — matches Android APK native splash */
export const NATIVE_SPLASH_ANDROID = {
  image: require('@/assets/images/logo1.png'),
  imageWidth: 100,
  aspect: 1,
};
