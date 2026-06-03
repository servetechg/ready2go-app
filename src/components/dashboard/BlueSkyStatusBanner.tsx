import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, palette, shadows, spacing } from '@/theme';

export function BlueSkyStatusBanner() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.banner, shadows.md]}>
      <View style={styles.iconWrap}>
        <Ionicons name="sunny" size={36} color={palette.primary} />
      </View>
      <View style={styles.textBlock}>
        <AppText variant="h3" color={colors.primary} style={styles.title}>
          All clear in your area
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          No active disruptions reported. Emergency news and administrator messages appear below.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: '#E8F4FC',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#C5DCF0',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: spacing.xs },
  title: { marginBottom: 2 },
});
