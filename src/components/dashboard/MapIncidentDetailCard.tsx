import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, shadows, spacing } from '@/theme';
import type { MapMarkerPoint } from '@/types/emergency';

type MapIncidentDetailCardProps = {
  incident: MapMarkerPoint;
  onClose: () => void;
};

export function MapIncidentDetailCard({ incident, onClose }: MapIncidentDetailCardProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, shadows.md, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flame" size={20} color={colors.primary} />
          <AppText variant="label" color={colors.primary} style={styles.title}>
            {incident.title}
          </AppText>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close incident details">
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
      {incident.description ? (
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.body}>
          {incident.description}
        </AppText>
      ) : null}
      {incident.severity ? (
        <AppText variant="caption" color={colors.textMuted}>
          Severity: {incident.severity}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    zIndex: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  body: {
    marginBottom: spacing.xs,
  },
});
