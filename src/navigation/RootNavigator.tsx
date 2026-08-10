import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { AUTH_ROUTES, ROOT_ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { hydrateTokens } from '@/redux/slices/authSlice';
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
  /** Live session requires a user profile — tokens alone are not enough (signup OTP). */
  const hasAuthenticatedUser = Boolean(user && hasToken);
  const awaitingEmailOtp = Boolean(
    otpEmail || pendingAuth || (user && !emailVerified),
  );

  // Clear orphan tokens left by the old signup bug (refresh without user / OTP).
  useEffect(() => {
    if (!sessionReady && !gateTimedOut) return;
    if (user || awaitingEmailOtp) return;
    if (!hasToken) return;
    dispatch(hydrateTokens({ token: null, refreshToken: null, replace: true }));
    void saveSession({ token: null, refreshToken: null, user: null });
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

  // Signup / login-unverified: stay on Auth → OTP (do not mount Main).
  if (awaitingEmailOtp && !emailVerified) {
    const email =
      otpEmail ||
      pendingAuth?.user?.email ||
      user?.email ||
      '';
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

  // No authenticated user → Auth (login/signup).
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
