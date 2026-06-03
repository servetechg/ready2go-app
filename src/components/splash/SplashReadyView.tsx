import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

interface SplashReadyViewProps {
  children: React.ReactNode;
}

/** Hides the native splash once the app root has laid out. */
export function SplashReadyView({ children }: SplashReadyViewProps) {
  const onLayout = useCallback((_event: LayoutChangeEvent) => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
}
