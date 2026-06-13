import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { WeatherSummaryCard } from '@/components/dashboard/WeatherSummaryCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { HOME_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppSelector } from '@/redux/hooks';
import { weatherService, type WeatherForecastDay } from '@/services/weather.service';
import { spacing } from '@/theme';
import type { WeatherSnapshot } from '@/types/dashboard';
import { getErrorMessage } from '@/utils/error';

export function WeatherScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { showError } = useToast();
  const token = useAppSelector((s) => s.auth.token);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [current, outlook] = await Promise.all([
          weatherService.getCurrent(token),
          weatherService.getForecast(token),
        ]);
        if (cancelled) return;
        setWeather(current);
        setForecast(outlook.days);
      } catch (error) {
        if (!cancelled) showError(getErrorMessage(error, 'Could not load weather'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, showError]);

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title="Weather" showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <WeatherSummaryCard weather={weather} />
        )}

        <AppCard style={styles.card}>
          <AppText variant="h3" style={styles.cardTitle}>
            7-Day Outlook
          </AppText>
          {forecast.length === 0 ? (
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Forecast unavailable.
            </AppText>
          ) : (
            forecast.map((day) => (
              <View key={day.date} style={styles.forecastRow}>
                <AppText variant="body" style={styles.day}>
                  {day.label}
                </AppText>
                <AppText variant="body" color={colors.textSecondary}>
                  {day.condition}
                </AppText>
                <AppText variant="label">
                  {day.highF}° / {day.lowF}°
                </AppText>
              </View>
            ))
          )}
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
  headerPad: {},
  content: { paddingBottom: spacing.xxxl },
  loader: { marginVertical: spacing.xl },
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
