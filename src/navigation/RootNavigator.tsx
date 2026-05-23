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
  const isAuthenticated = toBoolean(useAppSelector((s) => s.auth.isAuthenticated));
  const isComplete = toBoolean(useAppSelector((s) => s.registration.isComplete));
  const isStarted = toBoolean(useAppSelector((s) => s.registration.isStarted));
  const needsAccount = toBoolean(useAppSelector((s) => s.registration.needsAccount));

  const showOnboarding =
    (isAuthenticated && !isComplete) || (isStarted && !isComplete && !needsAccount);

  if (needsAccount) {
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen
          name={ROOT_ROUTES.AUTH}
          component={AuthNavigator}
          initialParams={{
            screen: AUTH_ROUTES.SIGNUP,
            params: { completeRegistration: true },
          }}
        />
      </Stack.Navigator>
    );
  }

  if (showOnboarding) {
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen name={ROOT_ROUTES.ONBOARDING} component={OnboardingNavigator} />
      </Stack.Navigator>
    );
  }

  if (isAuthenticated && isComplete) {
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen name={ROOT_ROUTES.MAIN} component={MainNavigator} />
      </Stack.Navigator>
    );
  }

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
