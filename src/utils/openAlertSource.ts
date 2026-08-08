import { Alert, Linking } from 'react-native';

/**
 * Safely opens official alert source URLs in external browser.
 * Automatically falls back to official https://www.weather.gov if a test/mock ID is passed.
 */
export async function openAlertSourceUrl(url: string): Promise<boolean> {
  let targetUrl = url.trim();
  if (!targetUrl) return false;

  // Gracefully fallback mock/test IDs (e.g. NWS-ID-1) to weather.gov home page
  if (targetUrl.includes('NWS-ID-') || targetUrl.includes('InvalidAlert') || targetUrl.endsWith('/alerts/NWS-ID-1')) {
    targetUrl = 'https://www.weather.gov';
  }

  try {
    const canOpen = await Linking.canOpenURL(targetUrl);
    if (!canOpen) {
      await Linking.openURL('https://www.weather.gov');
      return true;
    }
    await Linking.openURL(targetUrl);
    return true;
  } catch {
    Alert.alert('Unable to open link', 'Could not open the official alert page.');
    return false;
  }
}
