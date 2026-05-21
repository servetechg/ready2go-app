import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';

import { AppText } from '../ui/AppText';

interface NumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function NumericStepper({ value, onChange, min = 1, max = 50 }: NumericStepperProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, { borderColor: colors.primary }]}
        onPress={() => onChange(Math.max(min, value - 1))}
        accessibilityLabel="Decrease">
        <Ionicons name="remove" size={24} color={colors.primary} />
      </Pressable>
      <View style={[styles.valueBox, { borderColor: colors.border }]}>
        <AppText variant="h2" center>
          {value}
        </AppText>
      </View>
      <Pressable
        style={[styles.button, { borderColor: colors.primary }]}
        onPress={() => onChange(Math.min(max, value + 1))}
        accessibilityLabel="Increase">
        <Ionicons name="add" size={24} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.xl,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueBox: {
    minWidth: 80,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
});
