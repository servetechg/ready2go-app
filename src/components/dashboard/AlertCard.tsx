import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, palette, spacing } from '@/theme';
import type { WeatherAlert } from '@/types/dashboard';
import { openAlertSourceUrl } from '@/utils/openAlertSource';

interface AlertCardProps {
  alert: WeatherAlert;
  onPress?: (alert: WeatherAlert) => void;
}

export function AlertCard({ alert, onPress }: AlertCardProps) {
  const { colors } = useAppTheme();

  const severityStyle =
    alert.severity === 'MODERATE'
      ? styles.moderateBadge
      : alert.severity === 'HIGH' || alert.severity === 'EXTREME'
        ? styles.highBadge
        : styles.lowBadge;

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(alert);
      return;
    }
    if (alert.sourceUrl) {
      void openAlertSourceUrl(alert.sourceUrl);
    }
  }, [alert, onPress]);

  const isInteractive = Boolean(onPress || alert.sourceUrl);

  const content = (
    <>
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
        <View style={styles.metaRight}>
          {alert.sourceUrl ? (
            <Ionicons name="open-outline" size={16} color={colors.primary} style={styles.linkIcon} />
          ) : null}
          <AppText variant="caption" color={colors.textMuted} style={styles.issued}>
            {alert.issuedAgo}
          </AppText>
        </View>
      </View>

      <View style={styles.titleRow}>
        {!alert.read ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
        <AppText
          variant="h3"
          color={colors.primary}
          style={[styles.title, !alert.read && styles.unreadTitle]}>
          {alert.title}
        </AppText>
      </View>
      <AppText variant="caption" color={colors.textSecondary} style={styles.location}>
        {alert.location}
      </AppText>

      <View style={styles.footer}>
        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
        <AppText variant="caption" color={colors.textMuted}>
          {alert.expires}
        </AppText>
        {alert.sourceUrl ? (
          <AppText variant="caption" color={colors.primary} style={styles.viewSource}>
            View official source
          </AppText>
        ) : null}
      </View>
    </>
  );

  if (!isInteractive) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          !alert.read && styles.unreadCard,
          !alert.read && { borderLeftColor: colors.primary },
        ]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${alert.title}. ${alert.sourceUrl ? 'Opens official source' : 'Alert details'}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !alert.read && styles.unreadCard,
        !alert.read && { borderLeftColor: colors.primary },
        pressed && styles.pressed,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  unreadCard: {
    borderLeftWidth: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  unreadTitle: {
    fontFamily: fontFamily.bold,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, flex: 1 },
  metaRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  linkIcon: {
    marginBottom: 2,
  },
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
  title: { flex: 1 },
  location: { textTransform: 'uppercase', marginBottom: spacing.lg },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  viewSource: {
    marginLeft: 'auto',
    fontFamily: fontFamily.medium,
  },
});
