import {
  GoogleSans_400Regular,
  GoogleSans_500Medium,
  GoogleSans_600SemiBold,
  GoogleSans_700Bold,
} from '@expo-google-fonts/google-sans';
import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [loaded, error] = useFonts({
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
  });

  return { fontsLoaded: loaded, fontError: error };
}
