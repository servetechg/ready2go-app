import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';
import type { PreparednessCategory } from '@/types/preparedness';
import { preparednessIconName } from '@/utils/preparednessIcons';

interface PreparednessCategoryCardProps {
  category: PreparednessCategory;
  onPress: () => void;
}

export function PreparednessCategoryCard({ category, onPress }: PreparednessCategoryCardProps) {
  const { colors } = useAppTheme();
  const iconName = preparednessIconName(category.icon);

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <AppText variant="label" color={colors.primary} numberOfLines={2}>
            {category.title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {category.subtitle}
          </AppText>
        </View>
        <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name={iconName} size={18} color="#ED6C02" />
        </View>
      </View>
      <AppText variant="bodySmall" color={colors.textMuted} style={styles.empty}>
        {category.taskCount > 0
          ? `${category.taskCount} tasks available`
          : 'No tasks available in this category.'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '50%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
  empty: { marginTop: spacing.sm },
});
