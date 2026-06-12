/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');
const withGoogleMapsApiKey = require('./plugins/withGoogleMapsApiKey');

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  process.env.GOOGLE_MAPS_API_KEY ??
  '';

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      permissions: [
        ...(appJson.expo.android?.permissions ?? []),
        'android.permission.SCHEDULE_EXACT_ALARM',
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
      [withGoogleMapsApiKey, { apiKey: googleMapsApiKey }],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow Ready2Go to access your photos to set your profile picture.',
          cameraPermission: 'Allow Ready2Go to use the camera for your profile picture.',
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
            // Smaller APK: 64-bit phones only + strip unused code/resources
            buildArchs: ['arm64-v8a'],
            enableMinifyInReleaseBuilds: true,
            // Shrinking can strip Google Maps tile assets in release/preview APKs.
            enableShrinkResourcesInReleaseBuilds: false,
            extraProguardRules: `
              -keep class com.google.android.gms.** { *; }
              -keep interface com.google.android.gms.** { *; }
              -dontwarn com.google.android.gms.**
            `,
          },
        },
      ],
    ],
    extra: {
      ...appJson.expo.extra,
      eas: {
        projectId: 'fa398a3b-4d43-4415-8e4b-a4144bff2906',
      },
      googleMapsApiKey,
    },
  },
};
