import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PersonalizedNewsFeed } from '@/components/dashboard/PersonalizedNewsFeed';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { HOME_STACK_ROUTES } from '@/constants/routes';
import { spacing } from '@/theme';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';

type EmergencyNewsNav = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, typeof HOME_STACK_ROUTES.EMERGENCY_NEWS>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function EmergencyNewsScreen() {
  const navigation = useNavigation<EmergencyNewsNav>();

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.headerPad}>
        <AppHeader
          title="News Feed"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
      </View>
      <View style={styles.feedWrap}>
        <PersonalizedNewsFeed title="" scrollable={true} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {
    paddingHorizontal: spacing.sm,
  },
  feedWrap: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
