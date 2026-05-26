import React from 'react';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

import { AppText } from '../ui/AppText';

interface ErrorMessageProps {
  message?: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const { colors } = useAppTheme();

  const text = typeof message === 'string' ? message : undefined;
  if (!text) return null;

  return (
    <AppText variant="caption" color={colors.error} style={styles.error}>
      {text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  error: { marginTop: spacing.xs },
});
