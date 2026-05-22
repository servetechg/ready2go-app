import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';

import { AppText } from '../ui/AppText';
import { HeroBanner } from '../ui/HeroBanner';
import { ScreenWrapper } from './ScreenWrapper';

interface AuthLayoutProps {
  children: React.ReactNode;
  illustration?: React.ReactNode;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function AuthLayout({
  children,
  illustration,
  title,
  subtitle,
  showLogo = true,
}: AuthLayoutProps) {
  const { colors } = useAppTheme();

  return (
    <ScreenWrapper>
      {illustration}
      {toBoolean(showLogo) ? <HeroBanner compact={true} /> : null}
      <View style={styles.formArea}>
        {title ? (
          <AppText variant="h2" style={styles.title}>
            {title}
          </AppText>
        ) : null}
        {subtitle ? (
          <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  formArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: { marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { marginBottom: spacing.xl, textAlign: 'center' },
});
