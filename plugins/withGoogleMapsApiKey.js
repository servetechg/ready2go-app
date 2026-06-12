const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Ensures com.google.android.geo.API_KEY is present in AndroidManifest.xml.
 * react-native-maps tile loading requires this native key (separate from JS EXPO_PUBLIC_*).
 */
function withGoogleMapsApiKey(config, { apiKey } = {}) {
  const resolvedKey =
    apiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  if (!resolvedKey) {
    console.warn(
      '[withGoogleMapsApiKey] No Google Maps API key found at build time. Map tiles will be blank on Android.',
    );
    return config;
  }

  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      'com.google.android.geo.API_KEY',
      resolvedKey,
      'value',
    );
    return cfg;
  });
}

module.exports = withGoogleMapsApiKey;
