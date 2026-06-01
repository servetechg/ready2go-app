import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useSessionBootstrap } from '@/hooks/useSessionBootstrap';
import { RootNavigator } from '@/navigation';
import { persistor, store } from '@/redux/store';
import { palette } from '@/theme';
import { fontFamily } from '@/theme/fonts';
import { runStorageMigration } from '@/utils/storageMigration';

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
  useSessionBootstrap();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="auto" />
          <RootNavigator />
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
  if (!bootstrapped || !fontsLoaded) {
    return <LoadingSpinner fullScreen={true} message="Loading..." />;
  }

  return (
    <PersistGate
      loading={<LoadingSpinner fullScreen={true} message="Loading..." />}
      persistor={persistor}>
      <AppNavigation />
    </PersistGate>
  );
}

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const { fontsLoaded } = useAppFonts();

  useEffect(() => {
    runStorageMigration().finally(() => setBootstrapped(true));
  }, []);

  return (
    <Provider store={store}>
      <AppContent bootstrapped={bootstrapped} fontsLoaded={fontsLoaded} />
    </Provider>
  );
}
