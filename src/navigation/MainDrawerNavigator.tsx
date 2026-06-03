import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';

import { DrawerContent } from '@/components/dashboard/DrawerContent';
import { DRAWER_ROUTES } from '@/constants/routes';
import type { DrawerParamList } from '@/types/navigation';

import { MainStackNavigator } from './MainStackNavigator';

const Drawer = createDrawerNavigator<DrawerParamList>();

export function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerStyle: {
          width: '88%',
          backgroundColor: 'transparent',
          overflow: 'visible',
        },
        // sceneContainerStyle: { backgroundColor: 'transparent' },
      }}>
      <Drawer.Screen name={DRAWER_ROUTES.MAIN} component={MainStackNavigator} />
    </Drawer.Navigator>
  );
}
