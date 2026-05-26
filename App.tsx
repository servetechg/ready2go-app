import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useSessionBootstrap } from '@/hooks/useSessionBootstrap';
import { RootNavigator } from '@/navigation';
import { persistor, store } from '@/redux/store';
import { palette } from '@/theme';
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

function AppContent({ bootstrapped }: { bootstrapped: boolean }) {
  if (!bootstrapped) {
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

  useEffect(() => {
    runStorageMigration().finally(() => setBootstrapped(true));
  }, []);

  return (
    <Provider store={store}>
      <AppContent bootstrapped={bootstrapped} />
    </Provider>
  );
}
