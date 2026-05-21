import React from 'react';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

import { AppText } from './AppText';

interface StepInstructionProps {
  text: string;
}

export function StepInstruction({ text }: StepInstructionProps) {
  const { colors } = useAppTheme();

  return (
    <AppText variant="body" color={colors.textSecondary} style={styles.instruction}>
      {text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  instruction: { marginBottom: spacing.lg },
});
