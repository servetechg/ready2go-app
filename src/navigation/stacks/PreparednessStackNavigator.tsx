import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { PREPAREDNESS_STACK_ROUTES } from '@/constants/routes';
import { PreparednessCategoryScreen } from '@/screens/dashboard/PreparednessCategoryScreen';
import { PreparednessScreen } from '@/screens/dashboard/PreparednessScreen';
import type { PreparednessStackParamList } from '@/types/navigation';

import { stackScreenOptions } from '../screenOptions';

const Stack = createStackNavigator<PreparednessStackParamList>();

export function PreparednessStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name={PREPAREDNESS_STACK_ROUTES.LIST}
        component={PreparednessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={PREPAREDNESS_STACK_ROUTES.CATEGORY}
        component={PreparednessCategoryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
