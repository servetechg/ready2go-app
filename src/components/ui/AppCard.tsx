import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, shadows, spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';

interface AppCardProps {
  children: React.ReactNode;
  padded?: boolean;
  style?: ViewStyle;
}

export function AppCard({ padded = true, style, children }: AppCardProps) {
  const { colors } = useAppTheme();
  const isPadded = toBoolean(padded);

  return (
    <View
      style={[
        styles.card,
        shadows.md,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        isPadded ? styles.padded : undefined,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  padded: {
    padding: spacing.lg,
  },
});
