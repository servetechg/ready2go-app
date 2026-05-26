import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

import { AUTH_ROUTES, ROOT_ROUTES } from '@/constants/routes';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { OtpVerificationScreen } from '@/screens/auth/OtpVerificationScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { UpdatePasswordScreen } from '@/screens/auth/UpdatePasswordScreen';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import type { AuthStackParamList, RootStackParamList } from '@/types/navigation';

import { stackScreenOptions } from './screenOptions';

const Stack = createStackNavigator<AuthStackParamList>();

type AuthNavProps = {
  route: RouteProp<RootStackParamList, typeof ROOT_ROUTES.AUTH>;
};

export function AuthNavigator({ route }: AuthNavProps) {
  const initialScreen = (route.params?.screen ?? AUTH_ROUTES.LOGIN) as keyof AuthStackParamList;
  const screenParams = route.params?.params;

  return (
    <Stack.Navigator initialRouteName={initialScreen} screenOptions={stackScreenOptions}>
      <Stack.Screen name={AUTH_ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={AUTH_ROUTES.WELCOME} component={WelcomeScreen} />
      <Stack.Screen name={AUTH_ROUTES.SIGNUP} component={SignupScreen} />
      <Stack.Screen
        name={AUTH_ROUTES.OTP_VERIFICATION}
        component={OtpVerificationScreen}
        initialParams={
          initialScreen === AUTH_ROUTES.OTP_VERIFICATION
            ? (screenParams as AuthStackParamList[typeof AUTH_ROUTES.OTP_VERIFICATION])
            : undefined
        }
      />
      <Stack.Screen name={AUTH_ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen name={AUTH_ROUTES.UPDATE_PASSWORD} component={UpdatePasswordScreen} />
    </Stack.Navigator>
  );
}
