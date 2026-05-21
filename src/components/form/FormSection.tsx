import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from '../ui/AppText';

interface FormSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function FormSection({ title, subtitle, children }: FormSectionProps) {
  return (
    <View style={styles.section}>
      {title ? <AppText variant="label">{title}</AppText> : null}
      {subtitle ? (
        <AppText variant="bodySmall" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.md },
  content: { marginTop: spacing.sm },
});
