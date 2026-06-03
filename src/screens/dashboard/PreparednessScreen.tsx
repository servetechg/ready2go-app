import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PreparednessCategoryCard } from '@/components/dashboard/PreparednessCategoryCard';
import { AppText } from '@/components/ui/AppText';
import { PREPAREDNESS_CATEGORIES } from '@/constants/dashboard';
import { PREPAREDNESS_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/redux/hooks';
import { spacing } from '@/theme';
import type { PreparednessStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<
  PreparednessStackParamList,
  typeof PREPAREDNESS_STACK_ROUTES.LIST
>;

export function PreparednessScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PREPAREDNESS_CATEGORIES;
    return PREPAREDNESS_CATEGORIES.filter((c) => c.title.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <DashboardLayout>
      <View style={[styles.banner, { backgroundColor: colors.accent }]}>
        <AppText variant="h2" color={colors.primary}>
          Preparedness Guide
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.bannerSub}>
          Review preparedness tasks grouped by category. This view is read-only.
        </AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridWrap}>
        <View style={styles.grid}>
          {filtered.map((category) => (
            <PreparednessCategoryCard
              key={category.id}
              category={category}
              onPress={() =>
                navigation.navigate(PREPAREDNESS_STACK_ROUTES.CATEGORY, {
                  categoryId: category.id,
                  title: category.title,
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bannerSub: { marginTop: spacing.sm },
  gridWrap: { paddingBottom: spacing.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
