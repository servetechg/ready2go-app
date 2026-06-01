import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { MOCK_WEATHER } from '@/constants/dashboard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import type { WeatherSnapshot } from '@/types/dashboard';

interface WeatherSummaryCardProps {
  weather?: WeatherSnapshot;
  onPress?: () => void;
  onAlertSettingsPress?: () => void;
}

export function WeatherSummaryCard({
  weather = MOCK_WEATHER,
  onPress,
  onAlertSettingsPress,
}: WeatherSummaryCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <AppCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.main}>
            <AppText variant="caption" color={colors.textSecondary}>
              {weather.locationLabel}
            </AppText>
            <View style={styles.tempRow}>
              <Ionicons name="partly-sunny" size={36} color={colors.primary} />
              <AppText variant="display" style={styles.temp}>
                {weather.temperatureF}°
              </AppText>
            </View>
            <AppText variant="body" color={colors.textSecondary}>
              {weather.condition} · H {weather.highF}° L {weather.lowF}°
            </AppText>
          </View>
          <View style={styles.meta}>
            <AppText variant="caption" color={colors.textMuted}>
              Humidity {weather.humidity}%
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Wind {weather.windMph} mph
            </AppText>
          </View>
        </View>
        {onAlertSettingsPress ? (
          <Pressable style={styles.alertLink} onPress={onAlertSettingsPress}>
            <Ionicons name="notifications" size={16} color={colors.primary} />
            <AppText variant="label" color={colors.primary}>
              Manage weather alerts
            </AppText>
          </Pressable>
        ) : null}
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  main: { flex: 1, gap: spacing.xs },
  tempRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  temp: { fontSize: 40, paddingTop: spacing.xs },
  meta: { alignItems: 'flex-end', justifyContent: 'center', gap: spacing.xs },
  alertLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EEF4',
  },
});
