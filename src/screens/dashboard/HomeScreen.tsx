import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertCard } from '@/components/dashboard/AlertCard';
import { BlueSkyStatusBanner } from '@/components/dashboard/BlueSkyStatusBanner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DisruptionStatusBanner } from '@/components/dashboard/DisruptionStatusBanner';
import { EmergencyMap } from '@/components/dashboard/EmergencyMap';
import { IncidentLog } from '@/components/dashboard/IncidentLog';
import { PersonalizedNewsFeed } from '@/components/dashboard/PersonalizedNewsFeed';
import { PreparednessCategoryCard } from '@/components/dashboard/PreparednessCategoryCard';
import { PreparednessEmptyMessage } from '@/components/dashboard/PreparednessEmptyMessage';
import { WeatherSummaryCard } from '@/components/dashboard/WeatherSummaryCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import {
    HOME_STACK_ROUTES,
    PREPAREDNESS_STACK_ROUTES,
    TAB_ROUTES,
} from '@/constants/routes';
import { useAlertSourcePress } from '@/hooks/useAlertSourcePress';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { navigateToAlertsTab, navigateToTab } from '@/navigation/navigationHelpers';
import { navigateToCitizenAssistance } from '@/navigation/navigationRef';
import { useAppSelector } from '@/redux/hooks';
import { selectPreparednessCategories } from '@/redux/slices/dashboardSlice';
import { spacing } from '@/theme';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';
import { mapHomeAlertToWeatherAlert } from '@/utils/dashboardMappers';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';

type HomeNav = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, typeof HOME_STACK_ROUTES.HOME>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const mapSectionY = useRef(0);
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);
  const preparednessCategories = useAppSelector(selectPreparednessCategories);
  const alertItems = useAppSelector((s) => s.alerts.items ?? []);
  const slicePreparedness = useAppSelector((s) => s.preparedness.categories);
  const preparednessLoading = useAppSelector((s) => s.preparedness.loading);
  const { home, emergency, isCloudy, loading, error, reload } = useHomeDashboard();
  const { refreshControlProps } = usePullToRefresh(reload);
  const handleAlertPress = useAlertSourcePress();

  const recentAlerts = useMemo(() => {
    const fromHome = (home?.recentAlerts ?? []).map(mapHomeAlertToWeatherAlert);
    const fromAlertsTab = alertItems.map(mapHomeAlertToWeatherAlert);
    // Prefer home payload; fall back to alerts API so Home can show 2 when they exist.
    const merged = fromHome.length > 0 ? fromHome : fromAlertsTab;
    const q = searchQuery.trim().toLowerCase();
    const filtered = !q
      ? merged
      : merged.filter(
          (alert) =>
            alert.title.toLowerCase().includes(q) ||
            alert.location.toLowerCase().includes(q) ||
            alert.severity.toLowerCase().includes(q),
        );
    return filtered.slice(0, 2);
  }, [home?.recentAlerts, alertItems, searchQuery]);

  const hasSearch = Boolean(searchQuery.trim());

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source =
      preparednessCategories.length > 0 ? preparednessCategories : slicePreparedness;
    const matched = !q
      ? source
      : source.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.subtitle.toLowerCase().includes(q),
        );
    return matched.slice(0, 2);
  }, [preparednessCategories, slicePreparedness, searchQuery]);

  const showPreparednessEmpty =
    !loading && !preparednessLoading && filteredCategories.length === 0;

  const showMap = Boolean(home && emergency);
  const showIncidentLog = isCloudy && (emergency?.incidentLog?.length ?? 0) > 0;

  // Floating tab bar overlays content — keep last preparedness card fully visible.
  const scrollBottomPad = 72 + Math.max(insets.bottom, spacing.xs) + spacing.lg;

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

  if (loading && !home) {
    return (
      <DashboardLayout>
        <View style={styles.errorWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        refreshControl={
          <RefreshControl
            {...refreshControlProps}
            progressBackgroundColor={colors.background}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {isCloudy ? (
          <>
            <DisruptionStatusBanner status={home?.status} onViewSituation={scrollToSituation} />
            <Pressable onPress={navigateToCitizenAssistance}>
              <AppCard style={styles.assistanceCard}>
                <AppText variant="label">Need help or want to check in?</AppText>
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  Tap to mark safe or send a request to emergency coordinators
                </AppText>
              </AppCard>
            </Pressable>
          </>
        ) : (
          <BlueSkyStatusBanner status={home?.status} />
        )}

        {loading && !home ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : null}

        <View style={styles.sectionHeader}>
          <AppText variant="h3" color={colors.primary}>Active Alerts</AppText>
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
            <AlertCard key={alert.id} alert={alert} onPress={handleAlertPress} />
          ))
        )}

        {home ? (
          <>
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
                {showIncidentLog ? <IncidentLog entries={emergency?.incidentLog ?? []} /> : null}
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

        {home ? (
          <PersonalizedNewsFeed
            title="News Feed"
            scrollable={false}
            maxItems={3}
            showImages={false}
            showSectionHeader={true}
            onViewAll={() => navigation.navigate(HOME_STACK_ROUTES.EMERGENCY_NEWS)}
          />
        ) : null}

        <View style={styles.sectionHeader}>
          <AppText variant="h3" color={colors.primary}>Preparedness Guide</AppText>
          <Pressable onPress={() => navigation.getParent()?.navigate(TAB_ROUTES.PREPAREDNESS)}>
            <AppText variant="label" color={colors.primary}>
              View all
            </AppText>
          </Pressable>
        </View>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
          Local preparedness tasks for your registered address. This view is read-only.
        </AppText>
        {(loading || preparednessLoading) && filteredCategories.length === 0 ? (
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
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.sm },
  assistanceCard: { marginBottom: spacing.lg },
  loader: { marginVertical: spacing.lg },
  prepLoader: { marginBottom: spacing.lg },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  errorBody: { marginBottom: spacing.sm },
  emergencyBlock: { marginTop: spacing.md, gap: spacing.xl, marginBottom: spacing.lg },
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
});
