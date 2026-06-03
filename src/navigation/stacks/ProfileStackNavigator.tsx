import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { PROFILE_STACK_ROUTES } from '@/constants/routes';
import { EditProfileScreen } from '@/screens/dashboard/EditProfileScreen';
import { ProfileScreen } from '@/screens/dashboard/ProfileScreen';
import type { ProfileStackParamList } from '@/types/navigation';

import { stackScreenOptions } from '../screenOptions';

const Stack = createStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name={PROFILE_STACK_ROUTES.PROFILE}
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={PROFILE_STACK_ROUTES.EDIT_PROFILE}
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
