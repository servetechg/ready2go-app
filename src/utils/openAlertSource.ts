import { Alert, Linking } from 'react-native';

export async function openAlertSourceUrl(url: string): Promise<boolean> {
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const canOpen = await Linking.canOpenURL(trimmed);
    if (!canOpen) {
      Alert.alert('Unable to open link', 'This alert source page is not available on your device.');
      return false;
    }
    await Linking.openURL(trimmed);
    return true;
  } catch {
    Alert.alert('Unable to open link', 'Could not open the official alert page.');
    return false;
  }
}
