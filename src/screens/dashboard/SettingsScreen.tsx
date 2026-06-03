import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { HOME_STACK_ROUTES, MAIN_STACK_ROUTES, TAB_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  loadEmergencyDashboard,
  selectDashboardMode,
  setDisruptionModeOverride,
} from '@/redux/slices/dashboardSlice';
import { spacing } from '@/theme';
import type { DashboardMode } from '@/types/emergency';
import type { MainStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.SETTINGS>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const mode = useAppSelector(selectDashboardMode);
  const override = useAppSelector((s) => s.dashboard.disruptionModeOverride);
  const isCloudy = mode === 'cloudy';

  const openWeatherAlerts = () => {
    navigation.navigate(MAIN_STACK_ROUTES.TABS, {
      screen: TAB_ROUTES.HOME,
      params: { screen: HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS },
    });
  };

  const setPreviewMode = (next: DashboardMode | null) => {
    dispatch(setDisruptionModeOverride(next));
    void dispatch(loadEmergencyDashboard(next ?? 'blue_sky'));
  };

  const handleCloudyToggle = (enabled: boolean) => {
    setPreviewMode(enabled ? 'cloudy' : 'blue_sky');
  };

  const clearOverride = () => {
    dispatch(setDisruptionModeOverride(null));
    void dispatch(loadEmergencyDashboard('blue_sky'));
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title="Settings" showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppCard style={styles.card}>
          <AppText variant="label">Preview: Cloudy day mode</AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.cardSub}>
            Toggle to preview the GIS map and incident log on the home screen. When the backend is
            ready, this will follow live disruption status automatically.
          </AppText>
          <View style={styles.switchRow}>
            <AppText variant="body">Show disruption UI (cloudy)</AppText>
            <Switch
              value={isCloudy}
              onValueChange={handleCloudyToggle}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          {override ? (
            <Pressable onPress={clearOverride} style={styles.resetLink}>
              <AppText variant="bodySmall" color={colors.primary}>
                Reset to default (blue sky)
              </AppText>
            </Pressable>
          ) : null}
        </AppCard>

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
  cardSub: { marginTop: spacing.sm, marginBottom: spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resetLink: { marginTop: spacing.md },
});
