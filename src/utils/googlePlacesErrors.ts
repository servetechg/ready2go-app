/**
 * Maps/Places API error helpers and user-facing messages.
 * Web signup uses browser Places JS (HTTP referrer). Mobile uses REST from the device —
 * the same key often fails with REQUEST_DENIED unless configured for mobile apps.
 */

export function formatGooglePlacesError(status: string, errorMessage?: string): string {
  const msg = (errorMessage ?? '').toLowerCase();

  if (msg.includes('referer') || msg.includes('referrer') || msg.includes('not authorized')) {
    return (
      'This Google API key is restricted to websites only. For the mobile app, create a separate ' +
      'key in Google Cloud Console with Application restriction = None (dev) or Android/iOS apps, ' +
      'then set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env and restart Expo.'
    );
  }

  if (msg.includes('billing') || status === 'OVER_QUERY_LIMIT') {
    return (
      'Google Cloud billing or Places API is not enabled for this key. Enable billing and ' +
      'Places API + Geocoding API on the same project, or use a mobile-specific API key.'
    );
  }

  if (status === 'INVALID_REQUEST') {
    return errorMessage ?? 'Invalid Places request. Check your search text and try again.';
  }

  if (status === 'REQUEST_DENIED') {
    return (
      errorMessage ??
      'Google Places request denied. Use a mobile-compatible API key (not website-referrer only).'
    );
  }

  return errorMessage ?? `Places API error (${status})`;
}

export function isGoogleMapsKeyConfigured(key: string): boolean {
  return key.trim().length > 10;
}
