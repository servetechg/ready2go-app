import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import { DashboardTabBar } from '@/components/dashboard/DashboardTabBar';
import { TAB_ROUTES } from '@/constants/routes';
import { AlertsScreen } from '@/screens/dashboard/AlertsScreen';
import { ProfileScreen } from '@/screens/dashboard/ProfileScreen';
import type { MainTabParamList } from '@/types/navigation';

import { HomeStackNavigator } from './stacks/HomeStackNavigator';
import { PreparednessStackNavigator } from './stacks/PreparednessStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <DashboardTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}>
      <Tab.Screen name={TAB_ROUTES.HOME} component={HomeStackNavigator} />
      <Tab.Screen name={TAB_ROUTES.ALERTS} component={AlertsScreen} />
      <Tab.Screen name={TAB_ROUTES.PREPAREDNESS} component={PreparednessStackNavigator} />
      <Tab.Screen name={TAB_ROUTES.PROFILE} component={ProfileScreen} />
    </Tab.Navigator>
  );
}
