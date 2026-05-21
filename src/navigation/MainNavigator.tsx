import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { MAIN_ROUTES } from '@/constants/routes';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import type { MainStackParamList } from '@/types/navigation';

import { stackScreenOptions } from './screenOptions';

const Stack = createStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name={MAIN_ROUTES.DASHBOARD} component={DashboardScreen} />
    </Stack.Navigator>
  );
}
