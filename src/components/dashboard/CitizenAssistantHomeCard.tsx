import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';

type Props = {
  onPress: () => void;
};

/** Always-visible home entry for Citizen Assistant (safe check-in + reports + media). */
export function CitizenAssistantHomeCard({ onPress }: Props) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Citizen Assistant. Mark safe, request help, or report a need with photos or video."
    >
      <View style={styles.header}>
        <View style={styles.titles}>
          <AppText variant="label" color={colors.primary} numberOfLines={1}>
            Citizen Assistant
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            Check in, request help, or report a need
          </AppText>
        </View>
        <View style={[styles.iconCircle, { backgroundColor: '#E8EEF9' }]}>
          <Ionicons name="hand-left-outline" size={18} color={colors.primary} />
        </View>
      </View>
      <AppText variant="bodySmall" color={colors.textMuted}>
        Include photos or a short video when you report.
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  titles: { flex: 1 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
