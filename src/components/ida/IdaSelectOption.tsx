import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, palette, spacing } from '@/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  mode?: 'checkbox' | 'radio';
};

export function IdaSelectOption({ label, selected, onPress, mode = 'checkbox' }: Props) {
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
      accessibilityRole={mode === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={mode === 'radio' ? { selected } : { checked: selected }}>
      {selected ? (
        <Ionicons
          name={mode === 'radio' ? 'radio-button-on' : 'checkmark-circle'}
          size={22}
          color={colors.primary}
        />
      ) : (
        <View
          style={[
            mode === 'radio' ? styles.emptyRadio : styles.emptyCheck,
            { borderColor: palette.borderLight },
          ]}
        />
      )}
      <AppText variant="body" style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  emptyRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  label: { flex: 1 },
});
