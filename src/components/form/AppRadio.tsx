import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';

import { AppText } from '../ui/AppText';

interface AppRadioProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function AppRadio({ label, selected, onSelect }: AppRadioProps) {
  const { colors } = useAppTheme();
  const isSelected = toBoolean(selected);

  return (
    <Pressable
      style={styles.row}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}>
      <View style={[styles.outer, { borderColor: colors.primary }]}>
        {isSelected ? <View style={[styles.inner, { backgroundColor: colors.primary }]} /> : null}
      </View>
      <AppText variant="body">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
