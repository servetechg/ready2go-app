import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { AUTH_ROUTES, ROOT_ROUTES } from '@/constants/routes';
import { useAppSelector } from '@/redux/hooks';
import { toBoolean } from '@/utils/coerce';
import type { RootStackParamList } from '@/types/navigation';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { stackScreenOptions } from './screenOptions';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = toBoolean(useAppSelector((s) => s.auth.isAuthenticated));

  const emailVerified = toBoolean(user?.emailVerified);
  const profileComplete = toBoolean(user?.profileComplete);

  const hasSession = Boolean(token) && isAuthenticated;

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

  if (!emailVerified) {
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen
          name={ROOT_ROUTES.AUTH}
          component={AuthNavigator}
          initialParams={{
            screen: AUTH_ROUTES.OTP_VERIFICATION,
            params: {
              email: user?.email ?? '',
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
