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
import { useAppSelector } from '@/redux/hooks';
import {
  getNotificationsUnavailableReason,
  notificationService,
} from '@/services/notification.service';
import { profileService } from '@/services/profile.service';
import { spacing } from '@/theme';
import type { MainStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.SETTINGS>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const authToken = useAppSelector((s) => s.auth.token);

  const openWeatherAlerts = () => {
    navigation.navigate(MAIN_STACK_ROUTES.TABS, {
      screen: TAB_ROUTES.HOME,
      params: { screen: HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS },
    });
  };

  const handleTestLocalNotification = async () => {
    const limitation = getNotificationsUnavailableReason();
    if (limitation) {
      showError(limitation);
      return;
    }

    const id = await notificationService.sendImmediateTestNotification();
    if (id) {
      showSuccess('Local test notification sent!');
    } else {
      showError('Failed to send notification. Check permissions.');
    }
  };

  const handleTestServerPush = async () => {
    const limitation = getNotificationsUnavailableReason();
    if (limitation) {
      showError(limitation);
      return;
    }
    if (!authToken) {
      showError('Sign in to test server push.');
      return;
    }

    try {
      await profileService.sendTestServerPush(authToken);
      showSuccess('Server push sent! Check your device.');
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to send server push. Ensure token is registered.';
      showError(message);
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

        <Pressable onPress={handleTestLocalNotification}>
          <AppCard style={styles.card}>
            <AppText variant="label">Test local notification</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Fires on this device only (no backend)
            </AppText>
          </AppCard>
        </Pressable>

        <Pressable onPress={handleTestServerPush}>
          <AppCard style={styles.card}>
            <AppText variant="label">Test server push</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Sends via backend Expo API (same path as profile reminder cron)
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
