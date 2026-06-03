import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { HOME_STACK_ROUTES } from '@/constants/routes';
import { HomeScreen } from '@/screens/dashboard/HomeScreen';
import { WeatherAlertSettingsScreen } from '@/screens/dashboard/WeatherAlertSettingsScreen';
import { WeatherScreen } from '@/screens/dashboard/WeatherScreen';
import type { HomeStackParamList } from '@/types/navigation';

import { stackScreenOptions } from '../screenOptions';

const Stack = createStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name={HOME_STACK_ROUTES.HOME}
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={HOME_STACK_ROUTES.WEATHER}
        component={WeatherScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS}
        component={WeatherAlertSettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
