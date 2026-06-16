import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { AppText } from '@/components/ui/AppText';
import {
  NATIVE_SPLASH_ANDROID,
  NATIVE_SPLASH_CONFIG,
  NATIVE_SPLASH_IOS,
} from '@/constants/splash';
import { MAIN_STACK_ROUTES } from '@/constants/routes';
import { palette, spacing } from '@/theme';
import type { MainStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.SPLASH_PREVIEW>;

export function SplashPreviewScreen() {
  const navigation = useNavigation<Nav>();
  const splashAsset = Platform.OS === 'android' ? NATIVE_SPLASH_ANDROID : NATIVE_SPLASH_IOS;

  return (
    <View style={styles.root}>
      <AppSplashScreen variant="native" onClose={() => navigation.goBack()} />
      <View style={styles.hint} pointerEvents="none">
        <AppText variant="caption" color={palette.white} center style={styles.hintText}>
          {Platform.OS === 'android' ? 'Android APK' : 'iOS'} splash preview ·{' '}
          {splashAsset.imageWidth}px · {NATIVE_SPLASH_CONFIG.backgroundColor}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hint: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxxl,
  },
  hintText: { opacity: 0.85 },
});
