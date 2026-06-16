import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, palette, spacing } from '@/theme';

interface DisasterNeedOptionProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}

export function DisasterNeedOption({ label, icon, selected, onPress }: DisasterNeedOptionProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          borderColor: selected ? colors.primary : palette.borderLight,
          backgroundColor: colors.surface,
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}>
      <View style={styles.labelWrap}>
        {selected ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        ) : (
          <View style={[styles.emptyCheck, { borderColor: palette.borderLight }]} />
        )}
        <AppText variant="body" style={styles.label}>
          {label}
        </AppText>
      </View>
      <Ionicons name={icon} size={28} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.md,
  },
  emptyCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  label: { flex: 1 },
});
