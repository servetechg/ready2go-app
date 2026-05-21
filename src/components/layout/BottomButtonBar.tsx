import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme';

import { AppButton } from '../ui/AppButton';

interface BottomButtonBarProps {
  primaryTitle: string;
  onPrimaryPress: () => void;
  primaryLoading?: boolean;
  secondaryTitle?: string;
  onSecondaryPress?: () => void;
}

export function BottomButtonBar({
  primaryTitle,
  onPrimaryPress,
  primaryLoading,
  secondaryTitle,
  onSecondaryPress,
}: BottomButtonBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      {secondaryTitle && onSecondaryPress ? (
        <AppButton
          title={secondaryTitle}
          variant="outline"
          onPress={onSecondaryPress}
          style={styles.secondary}
        />
      ) : null}
      <AppButton title={primaryTitle} onPress={onPrimaryPress} loading={primaryLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  secondary: { marginBottom: spacing.xs },
});
