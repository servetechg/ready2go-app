import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { HOME_STACK_ROUTES, MAIN_STACK_ROUTES, TAB_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import type { MainStackParamList } from '@/types/navigation';
import { AppCard } from '@/components/ui/AppCard';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.SETTINGS>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();

  const openWeatherAlerts = () => {
    navigation.navigate(MAIN_STACK_ROUTES.TABS, {
      screen: TAB_ROUTES.HOME,
      params: { screen: HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS },
    });
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title="Settings" showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={openWeatherAlerts}>
          <AppCard style={styles.card}>
            <AppText variant="label">Weather alert subscriptions</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Manage flood, storm, and wind notifications
            </AppText>
          </AppCard>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg },
  content: { padding: spacing.lg },
  card: { marginBottom: spacing.md },
});
