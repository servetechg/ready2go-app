import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { palette, spacing } from '@/theme';
import type { EmergencyNewsItem } from '@/types/emergency';
import { formatNewsTimestamp } from '@/utils/formatTimestamp';

interface EmergencyNewsFeedProps {
  items: EmergencyNewsItem[];
  title?: string;
}

const SEVERITY_COLORS = {
  info: palette.tabActive,
  warning: '#ED6C02',
  critical: '#C62828',
} as const;

export function EmergencyNewsFeed({ items, title = 'Emergency News' }: EmergencyNewsFeedProps) {
  const { colors } = useAppTheme();

  if (items.length === 0) {
    return (
      <AppCard>
        <AppText variant="body" color={colors.textSecondary} center={true}>
          No emergency updates at this time.
        </AppText>
      </AppCard>
    );
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="h3" style={styles.title}>
        {title}
      </AppText>
      {items.map((item) => {
        const accent = item.severity ? SEVERITY_COLORS[item.severity] : colors.primary;
        return (
          <AppCard key={item.id} style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.badge, { backgroundColor: accent }]}>
                <Ionicons
                  name={item.source === 'admin' ? 'megaphone-outline' : 'newspaper-outline'}
                  size={14}
                  color={palette.white}
                />
              </View>
              <View style={styles.body}>
                <AppText variant="label">{item.title}</AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.time}>
                  {formatNewsTimestamp(item.timestamp)}
                  {item.source === 'admin' ? ' · Admin message' : ' · Emergency'}
                </AppText>
                <AppText variant="bodySmall" color={colors.textSecondary} style={styles.text}>
                  {item.body}
                </AppText>
              </View>
            </View>
          </AppCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  title: { marginBottom: spacing.xs },
  card: { marginBottom: 0 },
  row: { flexDirection: 'row', gap: spacing.md },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  time: { marginTop: spacing.xs, marginBottom: spacing.sm },
  text: { lineHeight: 20 },
});
