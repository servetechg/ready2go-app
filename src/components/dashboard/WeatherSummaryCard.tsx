import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import type { WeatherSnapshot } from '@/types/dashboard';

interface WeatherSummaryCardProps {
  weather?: WeatherSnapshot | null;
  onPress?: () => void;
  onAlertSettingsPress?: () => void;
  onCompleteProfilePress?: () => void;
}

export function WeatherSummaryCard({
  weather,
  onPress,
  onAlertSettingsPress,
  onCompleteProfilePress,
}: WeatherSummaryCardProps) {
  const { colors } = useAppTheme();

  if (!weather) {
    return (
      <AppCard style={styles.card}>
        <View style={styles.placeholder}>
          <Ionicons name="partly-sunny-outline" size={32} color={colors.textMuted} />
          <AppText variant="body" color={colors.textSecondary} center={true}>
            Weather unavailable. Complete your address in Profile to see local conditions.
          </AppText>
          {onCompleteProfilePress ? (
            <Pressable onPress={onCompleteProfilePress}>
              <AppText variant="label" color={colors.primary}>
                Go to Profile
              </AppText>
            </Pressable>
          ) : null}
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
    );
  }

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
  placeholder: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
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
