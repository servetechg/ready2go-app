import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setWeatherAlertPreference } from '@/redux/slices/dashboardSlice';
import { spacing } from '@/theme';

export function WeatherAlertSettingsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const preferences = useAppSelector((s) => s.dashboard.weatherAlertPreferences);

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader
          title="Weather Alerts"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
          Choose which watches and warnings you want to receive for your registered location.
        </AppText>
        {preferences.map((pref) => (
          <AppCard key={pref.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.textCol}>
                <AppText variant="label">{pref.label}</AppText>
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  {pref.description}
                </AppText>
              </View>
              <Switch
                value={pref.enabled}
                onValueChange={(enabled) => {
                  dispatch(setWeatherAlertPreference({ id: pref.id, enabled }));
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  intro: { marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  textCol: { flex: 1 },
});
