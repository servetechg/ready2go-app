import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { SplashReadyView } from '@/components/splash/SplashReadyView';
import { useInboxNotificationResponse } from '@/hooks/useInboxNotificationResponse';
import { useInboxNotificationsPolling } from '@/hooks/useInboxNotificationsPolling';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useSessionBootstrap } from '@/hooks/useSessionBootstrap';
import { useProfileReminder } from '@/hooks/useProfileReminder';
import { usePushTokenRegistration } from '@/hooks/usePushTokenRegistration';
import { RootNavigator } from '@/navigation';
import { navigationRef } from '@/navigation/navigationRef';
import { persistor, store } from '@/redux/store';
import { initNotificationHandler } from '@/services/notification.service';
import { palette } from '@/theme';
import { fontFamily } from '@/theme/fonts';
import Toast from 'react-native-toast-message';
import { runStorageMigration } from '@/utils/storageMigration';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.primary,
    background: palette.background,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
  },
  fonts: {
    regular: { fontFamily: fontFamily.regular, fontWeight: '400' as const },
    medium: { fontFamily: fontFamily.medium, fontWeight: '500' as const },
    bold: { fontFamily: fontFamily.bold, fontWeight: '700' as const },
    heavy: { fontFamily: fontFamily.bold, fontWeight: '700' as const },
  },
};

function AppNavigation() {
  useEffect(() => {
    void initNotificationHandler();
  }, []);

  useSessionBootstrap();
  usePushTokenRegistration();
  useProfileReminder();
  useInboxNotificationsPolling();
  useInboxNotificationResponse();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <StatusBar style="auto" />
          <RootNavigator />
          <Toast />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent({
  bootstrapped,
  fontsLoaded,
}: {
  bootstrapped: boolean;
  fontsLoaded: boolean;
}) {
  const showWebSplash = Platform.OS === 'web';

  if (!bootstrapped || !fontsLoaded) {
    return showWebSplash ? (
      <SafeAreaProvider>
        <AppSplashScreen />
      </SafeAreaProvider>
    ) : null;
  }

  return (
    <PersistGate
      loading={
        showWebSplash ? (
          <SafeAreaProvider>
            <AppSplashScreen />
          </SafeAreaProvider>
        ) : null
      }
      persistor={persistor}>
      <SplashReadyView>
        <AppNavigation />
      </SplashReadyView>
    </PersistGate>
  );
}

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const { fontsLoaded } = useAppFonts();

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }
    runStorageMigration().finally(() => setBootstrapped(true));
  }, [fontsLoaded]);

  return (
    <Provider store={store}>
      <AppContent bootstrapped={bootstrapped} fontsLoaded={fontsLoaded} />
    </Provider>
  );
}
