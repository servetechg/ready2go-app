import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';

interface AppContainerProps {
  children: React.ReactNode;
  padded?: boolean;
  safe?: boolean;
  style?: object;
}

export function AppContainer({
  padded = true,
  safe = false,
  style,
  children,
}: AppContainerProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isSafe = toBoolean(safe);
  const isPadded = toBoolean(padded);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        isSafe && { paddingTop: insets.top, paddingBottom: insets.bottom },
        isPadded && styles.padded,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
});
