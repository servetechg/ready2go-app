import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, palette, spacing } from '@/theme';
import type { WeatherAlert } from '@/types/dashboard';

interface AlertCardProps {
  alert: WeatherAlert;
  onTakeAction?: () => void;
}

export function AlertCard({ alert, onTakeAction }: AlertCardProps) {
  const { colors } = useAppTheme();

  const severityStyle =
    alert.severity === 'MODERATE'
      ? styles.moderateBadge
      : alert.severity === 'HIGH' || alert.severity === 'EXTREME'
        ? styles.highBadge
        : styles.lowBadge;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={styles.badges}>
          <View style={[styles.severityBadge, severityStyle]}>
            <AppText variant="caption" style={styles.severityText}>
              {alert.severity}
            </AppText>
          </View>
          <Ionicons name="rainy" size={18} color={palette.moderateBadgeText} />
          <View style={[styles.sourceBadge, { borderColor: colors.secondary }]}>
            <AppText variant="caption" color={colors.secondary}>
              SOURCE: {alert.source}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" color={colors.textMuted} style={styles.issued}>
          {alert.issuedAgo}
        </AppText>
      </View>

      <AppText variant="h3" color={colors.primary} style={styles.title}>
        {alert.title}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} style={styles.location}>
        {alert.location}
      </AppText>

      <View style={styles.footer}>
        <View style={styles.expires}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted}>
            {alert.expires}
          </AppText>
        </View>
        <Pressable
          style={styles.cta}
          onPress={onTakeAction}
          accessibilityRole="button"
          accessibilityLabel="Take action">
          <AppText variant="label" color={palette.white}>
            Take Action
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    // borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, flex: 1 },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  moderateBadge: { backgroundColor: palette.moderateBadge },
  highBadge: { backgroundColor: palette.errorLight },
  lowBadge: { backgroundColor: palette.accent },
  severityText: {
    fontFamily: fontFamily.bold,
    color: palette.moderateBadgeText,
    textTransform: 'uppercase',
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  issued: { maxWidth: 120, textAlign: 'right' },
  title: { marginBottom: spacing.xs },
  location: { textTransform: 'uppercase', marginBottom: spacing.lg },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  expires: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  cta: {
    backgroundColor: palette.alertCta,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
});
