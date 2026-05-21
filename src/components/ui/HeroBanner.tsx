import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';

import { AppText } from './AppText';

interface HeroBannerProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  compact?: boolean;
}

/** Solid-color hero (avoids LinearGradient native boolean issues on Android) */
export function HeroBanner({ children, style, compact = false }: HeroBannerProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.hero,
        compact && styles.compact,
        { backgroundColor: colors.primary },
        style,
      ]}>
      <View style={[styles.inner, { borderBottomColor: colors.primaryDark }]}>
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/logo.png')}  style={styles.logo} />
        </View>
        <AppText variant="body" color={colors.accent} center={true} style={styles.tagline}>
          Be Prepared. Stay Informed. We&apos;re Ready2Go.
        </AppText>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  logo: {
    width: 200,
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    resizeMode: 'contain',
  },
  compact: {
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  tagline: { marginTop: spacing.sm },
  logoContainer: {
    width: 200,
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
