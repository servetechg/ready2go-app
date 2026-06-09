import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PreparednessCategoryCard } from '@/components/dashboard/PreparednessCategoryCard';
import { PreparednessEmptyMessage } from '@/components/dashboard/PreparednessEmptyMessage';
import { AppText } from '@/components/ui/AppText';
import { PREPAREDNESS_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppSelector } from '@/redux/hooks';
import { selectPreparednessCategories } from '@/redux/slices/dashboardSlice';
import { spacing } from '@/theme';
import type { PreparednessStackParamList } from '@/types/navigation';
import { toBoolean } from '@/utils/coerce';

type Nav = StackNavigationProp<
  PreparednessStackParamList,
  typeof PREPAREDNESS_STACK_ROUTES.LIST
>;

export function PreparednessScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);
  const categories = useAppSelector(selectPreparednessCategories);
  const profileComplete = toBoolean(useAppSelector((s) => s.auth.user?.profileComplete));
  const { home, loading, error, reload } = useHomeDashboard();
  const { refreshControlProps } = usePullToRefresh(reload);

  const hasSearch = Boolean(searchQuery.trim());

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q),
    );
  }, [categories, searchQuery]);

  const showEmpty = home && !loading && filtered.length === 0;

  return (
    <DashboardLayout>
      <View style={[styles.banner, { backgroundColor: colors.accent }]}>
        <AppText variant="h2" color={colors.primary}>
          Preparedness Guide
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.bannerSub}>
          Local preparedness tasks for your registered address. This view is read-only.
        </AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridWrap}
        refreshControl={<RefreshControl {...refreshControlProps} />}>
        {!profileComplete ? (
          <PreparednessEmptyMessage hasSearch={false} />
        ) : null}

        {profileComplete && loading && categories.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {profileComplete && error && categories.length === 0 ? (
          <AppText variant="body" color={colors.error} center={true} style={styles.error}>
            {error}
          </AppText>
        ) : null}

        {profileComplete && showEmpty ? (
          <PreparednessEmptyMessage hasSearch={hasSearch} />
        ) : null}

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
  loader: { marginVertical: spacing.xl },
  error: { marginVertical: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
