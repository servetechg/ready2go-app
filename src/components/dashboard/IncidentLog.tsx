import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { palette, spacing } from '@/theme';
import type { IncidentLogEntry } from '@/types/emergency';
import { formatIncidentTimestamp } from '@/utils/formatTimestamp';

interface IncidentLogProps {
  entries: IncidentLogEntry[];
}

export function IncidentLog({ entries }: IncidentLogProps) {
  const { colors } = useAppTheme();

  return (
    <View>
      <AppText variant="h3" style={styles.title}>
        Incident log
      </AppText>
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
        Timestamped updates for those who cannot use the map.
      </AppText>
      <AppCard style={styles.card}>
        {entries.length === 0 ? (
          <AppText variant="body" color={colors.textSecondary}>
            No incidents reported.
          </AppText>
        ) : (
          entries.map((entry, index) => (
            <View
              key={entry.id}
              style={[styles.row, index < entries.length - 1 && styles.rowBorder]}>
              <Ionicons name="time-outline" size={16} color={palette.tabActive} />
              <View style={styles.rowBody}>
                <AppText variant="caption" color={colors.textMuted}>
                  {formatIncidentTimestamp(entry.timestamp)}
                </AppText>
                <AppText variant="body">{entry.message}</AppText>
              </View>
            </View>
          ))
        )}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.md },
  card: { gap: 0 },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.borderLight,
  },
  rowBody: { flex: 1, gap: spacing.xs },
});
