import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { AUTH_ROUTES, ROOT_ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearUnverifiedSession, hydrateTokens } from '@/redux/slices/authSlice';
import { asTokenString, saveSession } from '@/utils/authSessionStorage';
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
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth?.token);
  const refreshToken = useAppSelector((s) => s.auth?.refreshToken);
  const user = useAppSelector((s) => s.auth?.user);
  const otpEmail = useAppSelector((s) => s.auth?.otpEmail);
  const pendingAuth = useAppSelector((s) => s.auth?.pendingAuth);
  const sessionReady = useAppSelector((s) => s.auth?.sessionReady);
  const [gateTimedOut, setGateTimedOut] = useState(false);

  useEffect(() => {
    if (sessionReady) return;
    const t = setTimeout(() => setGateTimedOut(true), SESSION_GATE_MS);
    return () => clearTimeout(t);
  }, [sessionReady]);

  const emailVerified = toBoolean(user?.emailVerified);
  const profileComplete = toBoolean(user?.profileComplete);
  const hasToken = Boolean(asTokenString(token) || asTokenString(refreshToken));
  const hasAuthenticatedUser = Boolean(user && hasToken && emailVerified);

  /**
   * OTP is only an in-session flow (signup just completed, or login returned
   * EMAIL_NOT_VERIFIED). These fields are not persisted — so closing the app
   * returns the user to Login, as required.
   */
  const awaitingEmailOtp = Boolean(otpEmail || pendingAuth);

  // Drop persisted unverified sessions / orphan tokens so cold start shows Login.
  useEffect(() => {
    if (!sessionReady && !gateTimedOut) return;

    if (user && !toBoolean(user.emailVerified)) {
      dispatch(clearUnverifiedSession());
      return;
    }

    if (!user && !awaitingEmailOtp && hasToken) {
      dispatch(hydrateTokens({ token: null, refreshToken: null, replace: true }));
      void saveSession({ token: null, refreshToken: null, user: null });
    }
  }, [sessionReady, gateTimedOut, user, awaitingEmailOtp, hasToken, dispatch]);

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

  // Same-session signup / unverified login → OTP. Not used after app restart.
  if (awaitingEmailOtp) {
    const email = otpEmail || pendingAuth?.user?.email || '';
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen
          name={ROOT_ROUTES.AUTH}
          component={AuthNavigator}
          initialParams={{
            screen: AUTH_ROUTES.OTP_VERIFICATION,
            params: {
              email,
              flow: 'signup',
            },
          }}
        />
      </Stack.Navigator>
    );
  }

  // Cold start / no verified session → Login (and Signup from there).
  if (!hasAuthenticatedUser) {
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
