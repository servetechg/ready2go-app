import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { AlertCard } from '@/components/dashboard/AlertCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { PROFILE_STACK_ROUTES, TAB_ROUTES } from '@/constants/routes';
import { useAlertsDashboard } from '@/hooks/useAlertsDashboard';
import { useAlertSourcePress } from '@/hooks/useAlertSourcePress';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchAlerts,
  markAllAlertsReadRemote,
  setAlertsSort,
} from '@/redux/slices/alertsSlice';
import type { AlertsSort } from '@/types/alerts';
import type { MainTabParamList } from '@/types/navigation';
import { toBoolean } from '@/utils/coerce';
import { mapMobileAlertToWeatherAlert } from '@/utils/dashboardMappers';
import { formatAddressLine } from '@/utils/formatAddress';
import { filterAlertsByAllowedStates, getAllowedStateTokens } from '@/utils/alertFilters';
import { palette, spacing } from '@/theme';

type AlertsTabNav = BottomTabNavigationProp<MainTabParamList, typeof TAB_ROUTES.ALERTS>;

function AlertsListHeader({
  sort,
  onSortChange,
  onMarkAllRead,
  zoneSummary,
}: {
  sort: AlertsSort;
  onSortChange: (sort: AlertsSort) => void;
  onMarkAllRead: () => void;
  zoneSummary: string;
}) {
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

      <AppText variant="caption" color={colors.textSecondary} style={styles.zoneSummary}>
        Showing alerts for {zoneSummary}
      </AppText>

      <View style={styles.filters}>
        <Pressable
          onPress={() => onSortChange('recent')}
          style={[
            sort === 'recent' ? styles.filterActive : styles.filterInactive,
            sort === 'recent'
              ? { backgroundColor: palette.tabActive }
              : { borderColor: colors.border },
          ]}>
          <AppText variant="label" color={sort === 'recent' ? palette.white : colors.text}>
            Most Recent
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => onSortChange('severity')}
          style={[
            sort === 'severity' ? styles.filterActive : styles.filterInactive,
            sort === 'severity'
              ? { backgroundColor: palette.tabActive }
              : { borderColor: colors.border },
          ]}>
          <AppText variant="label" color={sort === 'severity' ? palette.white : colors.text}>
            By Severity
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

export function AlertsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<AlertsTabNav>();
  const { colors } = useAppTheme();
  const { items, loading, loadingMore, error, hasMore, filters, reload, loadMore } =
    useAlertsDashboard();
  const profileComplete = toBoolean(useAppSelector((s) => s.auth.user?.profileComplete));
  const address = useAppSelector((s) => s.registration.address);
  const alertLocations = useAppSelector((s) => s.registration.alertLocations ?? []);

  const { refreshControlProps } = usePullToRefresh(reload);
  const handleAlertPress = useAlertSourcePress();

  const zoneSummary = useMemo(() => {
    const zones: string[] = [];
    const home = formatAddressLine(address);
    if (home) zones.push(home);
    for (const loc of alertLocations) {
      const label = [loc.label, loc.city, loc.state].filter(Boolean).join(', ');
      if (label) zones.push(label);
    }
    return zones.length ? zones.join(' · ') : 'your saved locations';
  }, [address, alertLocations]);

  const displayAlerts = useMemo(() => {
    const mapped = items.map(mapMobileAlertToWeatherAlert);
    const allowedTokens = getAllowedStateTokens(address, alertLocations);
    return filterAlertsByAllowedStates(mapped, allowedTokens);
  }, [items, address, alertLocations]);

  const handleSortChange = useCallback(
    (sort: AlertsSort) => {
      dispatch(setAlertsSort(sort));
      void dispatch(fetchAlerts());
    },
    [dispatch],
  );

  const handleMarkAllRead = useCallback(() => {
    void dispatch(markAllAlertsReadRemote());
  }, [dispatch]);

  const goToProfile = useCallback(() => {
    navigation.navigate(TAB_ROUTES.PROFILE, {
      screen: PROFILE_STACK_ROUTES.PROFILE,
    });
  }, [navigation]);

  const listEmpty = useCallback(() => {
    if (!profileComplete) {
      return (
        <View style={styles.emptyBlock}>
          <AppText variant="body" color={colors.textSecondary} center={true}>
            Complete your emergency profile with a home address to receive location-based alerts.
          </AppText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyBlock}>
          <AppText variant="body" color={colors.textSecondary} center={true}>
            {error}
          </AppText>
          <AppButton title="Try again" onPress={() => void dispatch(fetchAlerts())} />
        </View>
      );
    }

    return (
      <View style={styles.emptyBlock}>
        <AppText variant="body" color={colors.textSecondary} center={true}>
          No active alerts for your locations right now.
        </AppText>
        <AppText variant="caption" color={colors.textMuted} center={true}>
          Add more places in Profile to watch additional areas.
        </AppText>
        <AppButton title="Manage alert locations" variant="secondary" onPress={goToProfile} />
      </View>
    );
  }, [colors.textMuted, colors.textSecondary, dispatch, error, goToProfile, profileComplete]);

  if (loading && displayAlerts.length === 0 && !error) {
    return (
      <DashboardLayout>
        <View style={styles.initialLoad}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText variant="body" color={colors.textSecondary} style={styles.loadingText}>
            Loading alerts for your locations…
          </AppText>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FlatList
        data={displayAlerts}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl {...refreshControlProps} />}
        onEndReached={displayAlerts.length > 0 ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <AlertsListHeader
            sort={filters.sort}
            onSortChange={handleSortChange}
            onMarkAllRead={handleMarkAllRead}
            zoneSummary={zoneSummary}
          />
        }
        renderItem={({ item }) => <AlertCard alert={item} onPress={handleAlertPress} />}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
          ) : hasMore ? null : displayAlerts.length > 0 ? (
            <AppText variant="caption" color={colors.textMuted} center={true} style={styles.endNote}>
              End of alerts for your locations
            </AppText>
          ) : null
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
    marginBottom: spacing.sm,
  },
  zoneSummary: {
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
  listContent: { paddingBottom: spacing.xl, flexGrow: 1 },
  initialLoad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  loadingText: { marginTop: spacing.sm },
  emptyBlock: { gap: spacing.md, paddingVertical: spacing.xl },
  footerLoader: { marginVertical: spacing.lg },
  endNote: { marginTop: spacing.md, marginBottom: spacing.lg },
});
