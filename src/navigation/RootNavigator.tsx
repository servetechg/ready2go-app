import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { AUTH_ROUTES, ROOT_ROUTES } from '@/constants/routes';
import { useAppSelector } from '@/redux/hooks';
import { asTokenString } from '@/utils/authSessionStorage';
import { toBoolean } from '@/utils/coerce';
import { palette } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { stackScreenOptions } from './screenOptions';

const Stack = createStackNavigator<RootStackParamList>();

/** Max time to wait for session bootstrap before showing UI anyway. */
const SESSION_GATE_MS = 2500;

export function RootNavigator() {
  const token = useAppSelector((s) => s.auth?.token);
  const refreshToken = useAppSelector((s) => s.auth?.refreshToken);
  const user = useAppSelector((s) => s.auth?.user);
  const sessionReady = useAppSelector((s) => s.auth?.sessionReady);
  const [gateTimedOut, setGateTimedOut] = useState(false);

  useEffect(() => {
    if (sessionReady) return;
    const t = setTimeout(() => setGateTimedOut(true), SESSION_GATE_MS);
    return () => clearTimeout(t);
  }, [sessionReady]);

  const emailVerified = toBoolean(user?.emailVerified);
  const profileComplete = toBoolean(user?.profileComplete);
  const hasSession = Boolean(asTokenString(token) || asTokenString(refreshToken));

  // Brief splash while disk restore runs — never spin forever.
  if (!sessionReady && !gateTimedOut) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.background,
        }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!hasSession) {
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen
          name={ROOT_ROUTES.AUTH}
          component={AuthNavigator}
          initialParams={{ screen: AUTH_ROUTES.LOGIN }}
        />
      </Stack.Navigator>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen name={ROOT_ROUTES.MAIN} component={MainNavigator} />
      </Stack.Navigator>
    );
  }

  if (!emailVerified) {
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen
          name={ROOT_ROUTES.AUTH}
          component={AuthNavigator}
          initialParams={{
            screen: AUTH_ROUTES.OTP_VERIFICATION,
            params: {
              email: user.email ?? '',
              flow: 'signup',
            },
          }}
        />
      </Stack.Navigator>
    );
  }

  if (!profileComplete) {
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen name={ROOT_ROUTES.ONBOARDING} component={OnboardingNavigator} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name={ROOT_ROUTES.MAIN} component={MainNavigator} />
    </Stack.Navigator>
  );
}
