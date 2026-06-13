import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { palette, spacing } from '@/theme';

/** logo.png is 1044×786 — scale down so full wordmark fits without horizontal clipping. */
const LOGO_WIDTH = 180;
const LOGO_ASPECT = 1044 / 786;

/** Branded splash UI — used on web and as a fallback while the native splash is visible. */
export function AppSplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Image
          accessibilityLabel="Ready2Go logo"
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
        />
        <AppText variant="body" color={palette.accent} center style={styles.tagline}>
          Be Prepared. Stay Informed. We&apos;re Ready2Go.
        </AppText>
      </View>
      <ActivityIndicator size="small" color={palette.accent} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    width: '100%',
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH / LOGO_ASPECT,
    maxWidth: '90%',
    resizeMode: 'contain',
  },
  tagline: {
    marginTop: spacing.lg,
    maxWidth: 280,
  },
  spinner: {
    marginBottom: spacing.huge,
  },
});
