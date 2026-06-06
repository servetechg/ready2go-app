import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AlertCard } from '@/components/dashboard/AlertCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchHome, markAlertRead, markAllAlertsRead } from '@/redux/slices/dashboardSlice';
import { palette, spacing } from '@/theme';

function AlertsListHeader({ onMarkAllRead }: { onMarkAllRead: () => void }) {
  const { colors } = useAppTheme();

  return (
    <View>
      <View style={styles.header}>
        <AppText variant="h2">Alerts</AppText>
        <Pressable onPress={onMarkAllRead}>
          <AppText variant="label" color={colors.primary}>
            Mark all read
          </AppText>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <View style={[styles.filterActive, { backgroundColor: palette.tabActive }]}>
          <AppText variant="label" color={palette.white}>
            Most Recent
          </AppText>
        </View>
        <View style={[styles.filterInactive, { borderColor: colors.border }]}>
          <AppText variant="label" color={colors.text}>
            By Severity
          </AppText>
        </View>
      </View>
    </View>
  );
}

export function AlertsScreen() {
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const alerts = useAppSelector((s) => s.dashboard.alerts);
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);

  const reload = useCallback(() => dispatch(fetchHome()).unwrap(), [dispatch]);
  const { refreshControlProps } = usePullToRefresh(reload);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return alerts;
    return alerts.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.severity.toLowerCase().includes(q),
    );
  }, [alerts, searchQuery]);

  return (
    <DashboardLayout>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl {...refreshControlProps} />}
        ListHeaderComponent={
          <AlertsListHeader onMarkAllRead={() => dispatch(markAllAlertsRead())} />
        }
        renderItem={({ item }) => (
          <AlertCard alert={item} onTakeAction={() => dispatch(markAlertRead(item.id))} />
        )}
        ListEmptyComponent={
          <AppText variant="body" color={colors.textSecondary} center={true}>
            No alerts match your search.
          </AppText>
        }
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  filterActive: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  filterInactive: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xl },
});
