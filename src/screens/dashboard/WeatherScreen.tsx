import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { WeatherSummaryCard } from '@/components/dashboard/WeatherSummaryCard';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { MOCK_WEATHER } from '@/constants/dashboard';
import { HOME_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/redux/hooks';
import { spacing } from '@/theme';
import { formatAddressLine } from '@/utils/formatAddress';

export function WeatherScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const address = useAppSelector((s) => s.registration.address);

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title="Weather" showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <WeatherSummaryCard weather={{ ...MOCK_WEATHER, locationLabel: formatAddressLine(address) }} />

        <AppCard style={styles.card}>
          <AppText variant="h3" style={styles.cardTitle}>
            7-Day Outlook
          </AppText>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
            <View key={day} style={styles.forecastRow}>
              <AppText variant="body" style={styles.day}>
                {day}
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                Partly cloudy
              </AppText>
              <AppText variant="label">
                {72 - i}° / {58 - i}°
              </AppText>
            </View>
          ))}
        </AppCard>

        <Pressable
          onPress={() => navigation.navigate(HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS as never)}>
          <AppCard style={styles.card}>
            <AppText variant="h3">Weather alert subscriptions</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} style={styles.linkSub}>
              Configure watches and warnings for your area →
            </AppText>
          </AppCard>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.lg },
  cardTitle: { marginBottom: spacing.md },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EEF4',
  },
  day: { width: 48 },
  linkSub: { marginTop: spacing.sm },
});
