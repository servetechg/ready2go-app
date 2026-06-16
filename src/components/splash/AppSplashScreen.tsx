import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import {
  NATIVE_SPLASH_ANDROID,
  NATIVE_SPLASH_CONFIG,
  NATIVE_SPLASH_IOS,
} from '@/constants/splash';
import { palette, spacing } from '@/theme';

export type AppSplashVariant = 'native' | 'loading';

interface AppSplashScreenProps {
  /** `native` matches the APK launch splash (logo only). `loading` adds tagline + spinner. */
  variant?: AppSplashVariant;
  onClose?: () => void;
}

function getNativeSplashAsset() {
  return Platform.OS === 'android' ? NATIVE_SPLASH_ANDROID : NATIVE_SPLASH_IOS;
}

export function AppSplashScreen({ variant = 'loading', onClose }: AppSplashScreenProps) {
  const insets = useSafeAreaInsets();
  const isNative = variant === 'native';
  const nativeAsset = getNativeSplashAsset();
  const logoWidth = isNative ? nativeAsset.imageWidth : 180;
  const logoSource = isNative ? nativeAsset.image : NATIVE_SPLASH_IOS.image;
  const logoAspect = isNative ? nativeAsset.aspect : NATIVE_SPLASH_IOS.aspect;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: NATIVE_SPLASH_CONFIG.backgroundColor,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}>
      {onClose ? (
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { top: insets.top + spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel="Close splash preview">
          <Ionicons name="close" size={28} color={palette.white} />
        </Pressable>
      ) : null}

      <View style={[styles.content, isNative && styles.contentNative]}>
        <Image
          accessibilityLabel="Ready2Go logo"
          source={logoSource}
          style={[
            styles.logo,
            {
              width: logoWidth,
              height: logoWidth / logoAspect,
            },
          ]}
        />
        {!isNative ? (
          <AppText variant="body" color={palette.accent} center style={styles.tagline}>
            Be Prepared. Stay Informed. We&apos;re Ready2Go.
          </AppText>
        ) : null}
      </View>

      {!isNative ? (
        <ActivityIndicator size="small" color={palette.accent} style={styles.spinner} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    width: '100%',
  },
  contentNative: {
    flex: 0,
    paddingHorizontal: 0,
  },
  logo: {
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
