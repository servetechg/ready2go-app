/** @type {import('expo/config').ExpoConfig} */
// Expo CLI / EAS local builds load .env automatically before this file runs.
const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

// Only the registration address search (Places web service) uses this; the dashboard map
// runs on OpenStreetMap tiles and needs no key.
const googleMapsApiKey = (
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  process.env.GOOGLE_MAPS_API_KEY ??
  ''
).trim();

const profileReminderSeconds = process.env.EXPO_PUBLIC_PROFILE_REMINDER_SECONDS ?? '';
const googleServicesFile = fs.existsSync(path.join(__dirname, 'google-services.json'))
  ? './google-services.json'
  : undefined;

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      permissions: [
        ...(appJson.expo.android?.permissions ?? []),
        'android.permission.INTERNET',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.USE_EXACT_ALARM',
        'android.permission.RECEIVE_BOOT_COMPLETED',
      ],
      config: {
        ...appJson.expo.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...appJson.expo.ios,
      config: {
        ...appJson.expo.ios?.config,
        googleMapsApiKey,
      },
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow Ready2Go to access your photos and videos for your profile and disaster survey.',
          cameraPermission:
            'Allow Ready2Go to use the camera for your profile picture and disaster survey evidence.',
          microphonePermission:
            'Allow Ready2Go to use the microphone when recording incident videos for disaster surveys.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Ready2Go uses your location to fill in your home address during registration.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#1B4F8A',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            // An APK missing a device's ABI crashes on launch (SoLoader cannot find
            // libreactnative.so). These three cover every real phone plus the x86_64
            // emulator; 32-bit x86 is emulator-only legacy and just slows the build.
            buildArchs: ['armeabi-v7a', 'arm64-v8a', 'x86_64'],
            enableMinifyInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
            extraProguardRules: `
              -keep class com.google.android.gms.** { *; }
              -keep interface com.google.android.gms.** { *; }
              -dontwarn com.google.android.gms.**
              -keep class com.rnmaps.maps.** { *; }
              -keep interface com.rnmaps.maps.** { *; }
              -dontwarn com.rnmaps.maps.**
            `,
          },
        },
      ],
    ],
    extra: {
      ...appJson.expo.extra,
      eas: {projectId: 'fa398a3b-4d43-4415-8e4b-a4144bff2906'},
      googleMapsApiKey,
      profileReminderSeconds: profileReminderSeconds
        ? Number(profileReminderSeconds)
        : undefined,
    },
  },
};
