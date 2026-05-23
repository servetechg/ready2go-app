import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

import { AUTH_ROUTES, ROOT_ROUTES } from '@/constants/routes';
import { useAppSelector } from '@/redux/hooks';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import type { AuthStackParamList, RootStackParamList } from '@/types/navigation';
import { toBoolean } from '@/utils/coerce';

import { stackScreenOptions } from './screenOptions';

const Stack = createStackNavigator<AuthStackParamList>();

type AuthNavProps = {
  route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.AUTH>;
};

export function AuthNavigator({ route }: AuthNavProps) {
  const needsAccount = toBoolean(useAppSelector((s) => s.registration.needsAccount));

  const initialScreen = needsAccount
    ? AUTH_ROUTES.SIGNUP
    : ((route.params?.screen ?? AUTH_ROUTES.LOGIN) as keyof AuthStackParamList);

  const signupInitialParams = needsAccount ? { completeRegistration: true as const } : undefined;

  return (
    <Stack.Navigator
      key={needsAccount ? 'auth-signup' : 'auth-default'}
      initialRouteName={initialScreen}
      screenOptions={stackScreenOptions}>
      <Stack.Screen name={AUTH_ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={AUTH_ROUTES.WELCOME} component={WelcomeScreen} />
      <Stack.Screen
        name={AUTH_ROUTES.SIGNUP}
        component={SignupScreen}
        initialParams={signupInitialParams}
      />
      <Stack.Screen name={AUTH_ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
