import { useColorScheme } from 'react-native';

import { useAppSelector } from '@/redux/hooks';
import { darkColors, lightColors, type ThemeColors } from '@/theme';

export function useAppTheme(): { colors: ThemeColors; isDark: boolean } {
  const systemScheme = useColorScheme();
  const storedScheme = useAppSelector((state) => state.ui.colorScheme);
  const effectiveScheme = storedScheme ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const isDark = effectiveScheme === 'dark';

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}
