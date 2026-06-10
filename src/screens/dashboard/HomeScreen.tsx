import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AlertCard } from '@/components/dashboard/AlertCard';
import { BlueSkyNewsFeed } from '@/components/dashboard/BlueSkyNewsFeed';
import { BlueSkyStatusBanner } from '@/components/dashboard/BlueSkyStatusBanner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DisruptionStatusBanner } from '@/components/dashboard/DisruptionStatusBanner';
import { EmergencyMap } from '@/components/dashboard/EmergencyMap';
import { IncidentLog } from '@/components/dashboard/IncidentLog';
import { PreparednessCategoryCard } from '@/components/dashboard/PreparednessCategoryCard';
import { PreparednessEmptyMessage } from '@/components/dashboard/PreparednessEmptyMessage';
import { WeatherSummaryCard } from '@/components/dashboard/WeatherSummaryCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import {
    HOME_STACK_ROUTES,
    PREPAREDNESS_STACK_ROUTES,
    TAB_ROUTES,
} from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { navigateToAlertsTab, navigateToTab } from '@/navigation/navigationHelpers';
import { useAppSelector } from '@/redux/hooks';
import { selectPreparednessCategories } from '@/redux/slices/dashboardSlice';
import { spacing } from '@/theme';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';
import { mapHomeAlertToWeatherAlert, mapHomeNewsToEmergencyNewsItem } from '@/utils/dashboardMappers';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';

type HomeNav = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, typeof HOME_STACK_ROUTES.HOME>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const mapSectionY = useRef(0);
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);
  const preparednessCategories = useAppSelector(selectPreparednessCategories);
  const { home, emergency, isCloudy, loading, error, reload } = useHomeDashboard();
  const { refreshControlProps } = usePullToRefresh(reload);

  const newsItems = useMemo(() => {
    const items = (home?.news ?? []).map(mapHomeNewsToEmergencyNewsItem);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        (item.location?.toLowerCase().includes(q) ?? false),
    );
  }, [home?.news, searchQuery]);

  const recentAlerts = useMemo(() => {
    const alerts = (home?.recentAlerts ?? []).map(mapHomeAlertToWeatherAlert);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return alerts;
    return alerts.filter(
      (alert) =>
        alert.title.toLowerCase().includes(q) ||
        alert.location.toLowerCase().includes(q) ||
        alert.severity.toLowerCase().includes(q),
    );
  }, [home?.recentAlerts, searchQuery]);

  const hasSearch = Boolean(searchQuery.trim());

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source = preparednessCategories;
    const matched = !q
      ? source
      : source.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.subtitle.toLowerCase().includes(q),
        );
    return matched.slice(0, 2);
  }, [preparednessCategories, searchQuery]);

  const showPreparednessEmpty = home && !loading && filteredCategories.length === 0;

  const showMap = Boolean(home && emergency);
  const showIncidentLog = isCloudy && (emergency?.incidentLog.length ?? 0) > 0;

  const openCategory = (categoryId: string, title: string) => {
    const tabNav = navigation.getParent();
    tabNav?.navigate(TAB_ROUTES.PREPAREDNESS, {
      screen: PREPAREDNESS_STACK_ROUTES.CATEGORY,
      params: { categoryId, title },
    });
  };

  const scrollToSituation = () => {
    scrollRef.current?.scrollTo({ y: mapSectionY.current, animated: true });
  };

  const openProfile = () => {
    navigateToTab(navigation, TAB_ROUTES.PROFILE);
  };

  if (error && !home) {
    return (
      <DashboardLayout>
        <View style={styles.errorWrap}>
          <AppText variant="h3" color={colors.primary} center={true}>
            Could not load dashboard
          </AppText>
          <AppText variant="body" color={colors.textSecondary} center={true} style={styles.errorBody}>
            {error}
          </AppText>
          <AppButton title="Try again" onPress={() => void reload()} />
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl {...refreshControlProps} />}>
        {isCloudy ? (
          <DisruptionStatusBanner status={home?.status} onViewSituation={scrollToSituation} />
        ) : (
          <BlueSkyStatusBanner status={home?.status} />
        )}

        {loading && !home ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : null}

        {home ? (
          <>
            <BlueSkyNewsFeed
              items={newsItems}
              maxVisible={4}
              onViewAll={() => navigation.navigate(HOME_STACK_ROUTES.EMERGENCY_NEWS)}
            />
            {showMap && emergency ? (
              <View
                style={styles.emergencyBlock}
                onLayout={(e) => {
                  mapSectionY.current = e.nativeEvent.layout.y;
                }}>
                <EmergencyMap
                  region={emergency.mapRegion}
                  markers={emergency.mapMarkers}
                  overlays={emergency.mapOverlays}
                  variant={isCloudy ? 'situation' : 'area'}
                />
                {showIncidentLog ? <IncidentLog entries={emergency.incidentLog} /> : null}
              </View>
            ) : null}
          </>
        ) : null}

        <WeatherSummaryCard
          weather={home?.weather}
          onPress={() => navigation.navigate(HOME_STACK_ROUTES.WEATHER)}
          onAlertSettingsPress={() =>
            navigation.navigate(HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS)
          }
          onCompleteProfilePress={openProfile}
        />

        {isCloudy ? (
          <>
            <View style={styles.sectionHeader}>
              <AppText variant="h3">Active Alerts</AppText>
              <Pressable onPress={() => navigateToAlertsTab(navigation)}>
                <AppText variant="label" color={colors.primary}>
                  View all
                </AppText>
              </Pressable>
            </View>
            {recentAlerts.length === 0 ? (
              <AppText variant="body" color={colors.textSecondary} style={styles.emptyAlerts}>
                No active alerts in your registered zones.
              </AppText>
            ) : (
              recentAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))
            )}
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <AppText variant="h3">Preparedness Guide</AppText>
        </View>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
          Local preparedness tasks for your registered address. This view is read-only.
        </AppText>
        {loading && home && filteredCategories.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.prepLoader} />
        ) : null}
        {showPreparednessEmpty ? <PreparednessEmptyMessage hasSearch={hasSearch} /> : null}
        <View style={styles.grid}>
          {filteredCategories.map((category) => (
            <PreparednessCategoryCard
              key={category.id}
              category={category}
              fullWidth={true}
              onPress={() => openCategory(category.id, category.title)}
            />
          ))}
        </View>
        {preparednessCategories.length > 2 ? (
          <Pressable
            style={styles.seeAll}
            onPress={() => navigation.getParent()?.navigate(TAB_ROUTES.PREPAREDNESS)}>
            <AppText variant="label" color={colors.primary}>
              See all
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl, paddingVertical: spacing.sm },
  loader: { marginVertical: spacing.lg },
  prepLoader: { marginBottom: spacing.lg },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  errorBody: { marginBottom: spacing.sm },
  emergencyBlock: { gap: spacing.xl, marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  subtitle: { marginBottom: spacing.lg },
  emptyAlerts: { marginBottom: spacing.lg },
  grid: {
    gap: spacing.sm,
  },
  seeAll: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
});
