import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { HOME_STACK_ROUTES, MAIN_STACK_ROUTES, TAB_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { notificationService } from '@/services/notification.service';
import { spacing } from '@/theme';
import type { MainStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.SETTINGS>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();

  const openWeatherAlerts = () => {
    navigation.navigate(MAIN_STACK_ROUTES.TABS, {
      screen: TAB_ROUTES.HOME,
      params: { screen: HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS },
    });
  };

  const handleTestNotification = async () => {
    const id = await notificationService.sendImmediateTestNotification();
    if (id) {
      showSuccess('Test notification sent!');
    } else {
      showError('Failed to send notification. Check permissions.');
    }
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

        <Pressable onPress={handleTestNotification}>
          <AppCard style={styles.card}>
            <AppText variant="label">Test push notification</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Trigger an immediate test push notification
            </AppText>
          </AppCard>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {},
  content: { paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.md },
});
