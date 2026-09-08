import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

let updateCheckStarted = false;

/**
 * Downloads compatible EAS updates in the background and lets the user
 * restart at a safe point. Network/update failures never block app startup.
 */
export function useAppUpdates() {
  useEffect(() => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled || updateCheckStarted) {
      return;
    }

    updateCheckStarted = true;
    let alive = true;

    const checkForUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable || !alive) return;

        await Updates.fetchUpdateAsync();
        if (!alive) return;

        Alert.alert(
          'Ready2Go update ready',
          'A new version has been downloaded. Restart now to use the latest improvements.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart now',
              onPress: () => {
                void Updates.reloadAsync();
              },
            },
          ],
          { cancelable: false },
        );
      } catch (error) {
        if (__DEV__) {
          console.warn('[updates] Could not check for an update', error);
        }
      }
    };

    void checkForUpdate();
    return () => {
      alive = false;
    };
  }, []);
}
