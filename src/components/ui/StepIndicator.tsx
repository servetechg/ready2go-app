import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

import { AppText } from './AppText';
import { ProgressBar } from './ProgressBar';

interface StepIndicatorProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
}

export function StepIndicator({ stepNumber, totalSteps, title }: StepIndicatorProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <AppText variant="caption" color={colors.primary}>
        Step {stepNumber} of {totalSteps}
      </AppText>
      <ProgressBar currentStep={stepNumber} totalSteps={totalSteps} />
      <AppText variant="h3" style={styles.title}>
        {stepNumber}. {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { marginTop: spacing.sm, color: '#33375D' },
});
