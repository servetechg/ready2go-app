import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { MAIN_STACK_ROUTES } from '@/constants/routes';
import { FaqScreen } from '@/screens/dashboard/FaqScreen';
import { SettingsScreen } from '@/screens/dashboard/SettingsScreen';
import { SplashPreviewScreen } from '@/screens/dashboard/SplashPreviewScreen';
import { StaticInfoScreen } from '@/screens/dashboard/StaticInfoScreen';
import type { MainStackParamList } from '@/types/navigation';

import { DisasterSurveyStackNavigator } from './DisasterSurveyStackNavigator';
import { IdaStackNavigator } from './IdaStackNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { stackScreenOptions } from './screenOptions';
import { CitizenAssistanceScreen } from '@/screens/citizen/CitizenAssistanceScreen';
import { NotificationsScreen } from '@/screens/dashboard/NotificationsScreen';
import { ChangePasswordScreen } from '@/screens/dashboard/ChangePasswordScreen';

const Stack = createStackNavigator<MainStackParamList>();

export function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name={MAIN_STACK_ROUTES.TABS}
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={MAIN_STACK_ROUTES.SETTINGS}
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={MAIN_STACK_ROUTES.STATIC_INFO}
        component={StaticInfoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={MAIN_STACK_ROUTES.FAQ}
        component={FaqScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={MAIN_STACK_ROUTES.DISASTER_SURVEY}
        component={DisasterSurveyStackNavigator}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: false,
          detachPreviousScreen: true,
        }}
      />
      <Stack.Screen
        name={MAIN_STACK_ROUTES.IDA}
        component={IdaStackNavigator}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: false,
          detachPreviousScreen: true,
        }}
      />
      <Stack.Screen
        name={MAIN_STACK_ROUTES.CITIZEN_ASSISTANCE}
        component={CitizenAssistanceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={MAIN_STACK_ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={MAIN_STACK_ROUTES.SPLASH_PREVIEW}
        component={SplashPreviewScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name={MAIN_STACK_ROUTES.CHANGE_PASSWORD}
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
