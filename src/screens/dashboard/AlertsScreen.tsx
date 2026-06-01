import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AlertCard } from '@/components/dashboard/AlertCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { markAlertRead, markAllAlertsRead } from '@/redux/slices/dashboardSlice';
import { palette, spacing } from '@/theme';

export function AlertsScreen() {
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const alerts = useAppSelector((s) => s.dashboard.alerts);
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);

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
      <View style={styles.header}>
        <AppText variant="h2">Alerts</AppText>
        <Pressable onPress={() => dispatch(markAllAlertsRead())}>
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
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
  list: { paddingBottom: spacing.xl },
});
