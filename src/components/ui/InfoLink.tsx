import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

import { AppText } from './AppText';

interface InfoLinkProps {
  label?: string;
  onPress: () => void;
}

export function InfoLink({
  label = 'Why do we need this information?',
  onPress,
}: InfoLinkProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={styles.pressable}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
      <AppText variant="bodySmall" color={colors.primary} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  label: { textDecorationLine: 'underline' },
});
