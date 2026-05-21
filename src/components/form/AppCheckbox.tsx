import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';

import { AppText } from '../ui/AppText';

interface AppCheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function AppCheckbox({ label, checked, onToggle, disabled }: AppCheckboxProps) {
  const { colors } = useAppTheme();
  const isChecked = toBoolean(checked);
  const isDisabled = disabled === undefined ? false : toBoolean(disabled);

  return (
    <Pressable
      style={styles.row}
      onPress={onToggle}
      disabled={isDisabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked }}>
      <View
        style={[
          styles.box,
          {
            borderColor: isChecked ? colors.primary : colors.border,
            backgroundColor: isChecked ? colors.primary : colors.surface,
          },
        ]}>
        {isChecked ? <Ionicons name="checkmark" size={16} color={colors.textInverse} /> : null}
      </View>
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
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
});
