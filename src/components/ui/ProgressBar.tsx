import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius } from '@/theme';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const { colors } = useAppTheme();
  const progress = Math.min(currentStep / totalSteps, 1);

  return (
    <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: colors.progressFill,
            width: `${progress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
