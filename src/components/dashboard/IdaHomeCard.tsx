import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle: string;
  cta: string;
  onPress: () => void;
};

/** Compact home entry when an IDA invitation is open. */
export function IdaHomeCard({ title, subtitle, cta, onPress }: Props) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface, borderColor: '#DC2626' }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${cta}`}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <AppText variant="label" color={colors.primary} numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {subtitle}
          </AppText>
        </View>
        <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="document-text-outline" size={18} color="#DC2626" />
        </View>
      </View>
      <AppText variant="bodySmall" color={colors.primary} style={styles.cta}>
        {cta}
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
  cta: { fontWeight: '600' },
});
