import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import type { Persistor } from 'redux-persist';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { SplashReadyView } from '@/components/splash/SplashReadyView';
import { useInboxNotificationResponse } from '@/hooks/useInboxNotificationResponse';
import { useInboxNotificationsPolling } from '@/hooks/useInboxNotificationsPolling';
import { useAppUpdates } from '@/hooks/useAppUpdates';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useSessionBootstrap } from '@/hooks/useSessionBootstrap';
import { useProfileReminder } from '@/hooks/useProfileReminder';
import { usePushTokenRegistration } from '@/hooks/usePushTokenRegistration';
import { RootNavigator } from '@/navigation';
import { navigationRef } from '@/navigation/navigationRef';
import { hydrateTokens, logout, setCredentials } from '@/redux/slices/authSlice';
import { initPersistor, store } from '@/redux/store';
import { initNotificationHandler } from '@/services/notification.service';
import { palette } from '@/theme';
import { fontFamily } from '@/theme/fonts';
import Toast from 'react-native-toast-message';
import { loadSession } from '@/utils/authSessionStorage';
import { guardFreshInstall } from '@/utils/freshInstallGuard';
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

async function restoreSessionFromDisk(): Promise<void> {
  const stored = await loadSession();
  if (!stored) return;

  const state = store.getState().auth;
  const hasReduxToken = Boolean(state?.token || state?.refreshToken);
  if (hasReduxToken) return;

  // Unverified users must land on Login after app restart (OTP only after login).
  const verified =
    stored.user &&
    (stored.user.emailVerified === true ||
      String(stored.user.emailVerified).toLowerCase() === 'true');

  if (stored.user && stored.token && verified) {
    store.dispatch(
      setCredentials({
        user: stored.user,
        token: stored.token,
        refreshToken: stored.refreshToken ?? undefined,
      }),
    );
  } else if (stored.token || stored.refreshToken) {
    // Orphan / unverified session — do not hydrate into a live session.
    if (!verified) {
      return;
    }
    store.dispatch(
      hydrateTokens({
        token: stored.token || null,
        refreshToken: stored.refreshToken,
        replace: true,
      }),
    );
  }

  if (__DEV__) {
    console.log('[app] restored session from disk', {
      hasAccess: Boolean(stored.token),
      hasRefresh: Boolean(stored.refreshToken),
      hasUser: Boolean(stored.user),
      verified: Boolean(verified),
    });
  }
}

function AppNavigation() {
  useEffect(() => {
    void initNotificationHandler();
  }, []);

  useAppUpdates();
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
  fontsLoaded,
  persistor,
}: {
  fontsLoaded: boolean;
  persistor: Persistor | null;
}) {
  const showWebSplash = Platform.OS === 'web';

  if (!fontsLoaded || !persistor) {
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
      persistor={persistor}
      onBeforeLift={() => restoreSessionFromDisk()}>
      <SplashReadyView>
        <AppNavigation />
      </SplashReadyView>
    </PersistGate>
  );
}

export default function App() {
  const [persistor, setPersistor] = useState<Persistor | null>(null);
  const { fontsLoaded } = useAppFonts();

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }
    let cancelled = false;
    (async () => {
      await runStorageMigration();
      const wasFreshInstall = await guardFreshInstall();
      if (wasFreshInstall) {
        store.dispatch(logout());
      }
      if (cancelled) return;
      setPersistor(initPersistor());
    })().catch(() => {
      if (!cancelled) {
        setPersistor(initPersistor());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fontsLoaded]);

  return (
    <Provider store={store}>
      <AppContent fontsLoaded={fontsLoaded} persistor={persistor} />
    </Provider>
  );
}
