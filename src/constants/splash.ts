/**
 * Keep in sync with app.json → expo-splash-screen plugin.
 * Android APK must use the square padded asset — wide logo1.png clips on Android 12+.
 */
export const NATIVE_SPLASH_CONFIG = {
  backgroundColor: '#1B4F8A',
  resizeMode: 'contain' as const,
};

/** Wide wordmark — iOS splash + in-app loading variant */
export const NATIVE_SPLASH_IOS = {
  image: require('@/assets/images/logo1.png'),
  imageWidth: 200,
  aspect: 1158 / 896,
};

/** Square padded asset — must match app.json android.expo-splash-screen image */
export const NATIVE_SPLASH_ANDROID = {
  image: require('@/assets/images/splash-android.png'),
  imageWidth: 200,
  aspect: 1,
};
