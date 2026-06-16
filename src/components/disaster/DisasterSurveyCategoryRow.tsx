import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

interface DisasterSurveyCategoryRowProps {
  index: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function DisasterSurveyCategoryRow({ index, title, icon }: DisasterSurveyCategoryRowProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <AppText variant="label" color={colors.primary} style={styles.index}>
        {index}.
      </AppText>
      <AppText variant="body" style={styles.title}>
        {title}
      </AppText>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  index: { width: 20 },
  title: { flex: 1 },
});
