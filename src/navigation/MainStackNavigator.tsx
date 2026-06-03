import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { MAIN_STACK_ROUTES } from '@/constants/routes';
import { SettingsScreen } from '@/screens/dashboard/SettingsScreen';
import { StaticInfoScreen } from '@/screens/dashboard/StaticInfoScreen';
import type { MainStackParamList } from '@/types/navigation';

import { MainTabNavigator } from './MainTabNavigator';
import { stackScreenOptions } from './screenOptions';

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
    </Stack.Navigator>
  );
}
