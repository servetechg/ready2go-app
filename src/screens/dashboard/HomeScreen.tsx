import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo, useRef } from 'react';
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
import { AppText } from '@/components/ui/AppText';
import {
  HOME_STACK_ROUTES,
  PREPAREDNESS_STACK_ROUTES,
  TAB_ROUTES,
} from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useEmergencyDashboard } from '@/hooks/useEmergencyDashboard';
import { usePreparednessCategories } from '@/hooks/usePreparednessCategories';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { navigateToAlertsTab } from '@/navigation/navigationHelpers';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  clearPreparednessCache,
  fetchCategories,
} from '@/redux/slices/preparednessSlice';
import { spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';
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
  const alerts = useAppSelector((s) => s.dashboard.alerts);
  const categories = useAppSelector((s) => s.preparedness.categories);
  const categoriesLoading = useAppSelector((s) => s.preparedness.loading);
  const profileComplete = toBoolean(useAppSelector((s) => s.auth.user?.profileComplete));
  const dispatch = useAppDispatch();
  const { isCloudy, emergency, loading, reload: reloadEmergency } = useEmergencyDashboard();
  const reload = useCallback(async () => {
    dispatch(clearPreparednessCache());
    await Promise.all([
      reloadEmergency(),
      dispatch(fetchCategories(undefined)).unwrap(),
    ]);
  }, [dispatch, reloadEmergency]);
  const { refreshControlProps } = usePullToRefresh(reload);

  usePreparednessCategories();

  const hasSearch = Boolean(searchQuery.trim());

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source = categories;
    const matched = !q
      ? source
      : source.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.subtitle.toLowerCase().includes(q),
        );
    return matched.slice(0, 4);
  }, [categories, searchQuery]);

  const showPreparednessEmpty =
    profileComplete && !categoriesLoading && filteredCategories.length === 0;

  const recentAlerts = alerts.slice(0, 2);

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

  return (
    <DashboardLayout>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl {...refreshControlProps} />}>
        {isCloudy ? (
          <DisruptionStatusBanner onViewSituation={scrollToSituation} />
        ) : (
          <BlueSkyStatusBanner />
        )}

        {loading && !emergency ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : null}

        {emergency ? (
          <>
            <BlueSkyNewsFeed
              items={emergency.news}
              maxVisible={4}
              onViewAll={() => navigation.navigate(HOME_STACK_ROUTES.EMERGENCY_NEWS)}
            />
            {isCloudy ? (
              <View
                style={styles.emergencyBlock}
                onLayout={(e) => {
                  mapSectionY.current = e.nativeEvent.layout.y;
                }}>
                <EmergencyMap region={emergency.mapRegion} markers={emergency.mapMarkers} />
                <IncidentLog entries={emergency.incidentLog} />
              </View>
            ) : null}
          </>
        ) : null}

        <WeatherSummaryCard
          onPress={() => navigation.navigate(HOME_STACK_ROUTES.WEATHER)}
          onAlertSettingsPress={() =>
            navigation.navigate(HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS)
          }
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
            {recentAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <AppText variant="h3">Preparedness Guide</AppText>
          {categories.length > 4 ? (
            <Pressable onPress={() => navigation.getParent()?.navigate(TAB_ROUTES.PREPAREDNESS)}>
              <AppText variant="label" color={colors.primary}>
                See all
              </AppText>
            </Pressable>
          ) : null}
        </View>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
          Local preparedness tasks for your registered address. This view is read-only.
        </AppText>
        {profileComplete && categoriesLoading && categories.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.prepLoader} />
        ) : null}
        {showPreparednessEmpty ? <PreparednessEmptyMessage hasSearch={hasSearch} /> : null}
        <View style={styles.grid}>
          {filteredCategories.map((category) => (
            <PreparednessCategoryCard
              key={category.id}
              category={category}
              onPress={() => openCategory(category.id, category.title)}
            />
          ))}
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl, paddingVertical: spacing.sm },
  loader: { marginVertical: spacing.lg },
  prepLoader: { marginBottom: spacing.lg },
  emergencyBlock: { gap: spacing.xl, marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  subtitle: { marginBottom: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
