import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';

import { AppText } from './AppText';

interface OnboardingPurposeNoteProps {
  text: string;
}

export function OnboardingPurposeNote({ text }: OnboardingPurposeNoteProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.accent }]}>
      <Ionicons name="information-circle" size={22} color={colors.primary} />
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  text: { flex: 1 },
});
