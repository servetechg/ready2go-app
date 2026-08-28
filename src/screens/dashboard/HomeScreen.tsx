import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertCard } from '@/components/dashboard/AlertCard';
import { BlueSkyStatusBanner } from '@/components/dashboard/BlueSkyStatusBanner';
import { CitizenAssistantHomeCard } from '@/components/dashboard/CitizenAssistantHomeCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DisruptionStatusBanner } from '@/components/dashboard/DisruptionStatusBanner';
import { EmergencyMap } from '@/components/dashboard/EmergencyMap';
import { IdaHomeCard } from '@/components/dashboard/IdaHomeCard';
import { IncidentLog } from '@/components/dashboard/IncidentLog';
import { PersonalizedNewsFeed } from '@/components/dashboard/PersonalizedNewsFeed';
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
import { useActiveIda } from '@/hooks/useActiveIda';
import { useAlertSourcePress } from '@/hooks/useAlertSourcePress';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { useAlertMapCoordinates } from '@/hooks/useAlertMapCoordinates';
import { useRegisteredHomeCoordinates, separateFromReference } from '@/hooks/useRegisteredHomeCoordinates';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { navigateToAlertsTab, navigateToTab } from '@/navigation/navigationHelpers';
import {
  navigateToCitizenAssistance,
  navigateToIdaIfActive,
} from '@/navigation/navigationRef';
import { useAppSelector } from '@/redux/hooks';
import { selectPreparednessCategories } from '@/redux/slices/dashboardSlice';
import { spacing } from '@/theme';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';
import { mapHomeAlertToWeatherAlert, mergeWeatherAlerts } from '@/utils/dashboardMappers';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { filterAlertsByAllowedStates, filterMapMarkersByAllowedStates, getAllowedStateTokens } from '@/utils/alertFilters';
import { calculateRegionForMarkers, resolveMapRegion } from '@/utils/mapRegion';
import type { MapMarkerPoint } from '@/types/emergency';

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
  const address = useAppSelector((s) => s.registration.address);
  const alertLocations = useAppSelector((s) => s.registration.alertLocations ?? []);
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);
  const preparednessCategories = useAppSelector(selectPreparednessCategories);
  const alertItems = useAppSelector((s) => s.alerts.items ?? []);
  const slicePreparedness = useAppSelector((s) => s.preparedness.categories);
  const preparednessLoading = useAppSelector((s) => s.preparedness.loading);
  const authToken = useAppSelector((s) => s.auth.token);
  const { invitation: idaInvitation, hasOpenIda } = useActiveIda(authToken);
  const { home, emergency, isCloudy, loading, error, reload } = useHomeDashboard();
  const { refreshControlProps } = usePullToRefresh(reload);
  const handleAlertPress = useAlertSourcePress();

  const allowedTokens = useMemo(() => {
    return getAllowedStateTokens(address, alertLocations);
  }, [address, alertLocations]);

  const allActiveAlerts = useMemo(() => {
    const homeAlerts = Array.isArray(home?.recentAlerts) ? home.recentAlerts : [];
    const fromHome = homeAlerts.map(mapHomeAlertToWeatherAlert);
    
    const tabAlerts = Array.isArray(alertItems) ? alertItems : [];
    const fromAlertsTab = tabAlerts.map(mapHomeAlertToWeatherAlert);
    
    const merged = mergeWeatherAlerts(fromHome, fromAlertsTab);
    const stateFiltered = filterAlertsByAllowedStates(merged, allowedTokens);

    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return stateFiltered;
    
    return stateFiltered.filter(
      (alert) => {
        const title = alert.title || alert.name || '';
        return title.toLowerCase().includes(q) ||
          (alert.location || '').toLowerCase().includes(q) ||
          (alert.severity || '').toLowerCase().includes(q);
      }
    );
  }, [home?.recentAlerts, alertItems, searchQuery, allowedTokens]);

  const recentAlerts = useMemo(() => {
    return allActiveAlerts.slice(0, 2);
  }, [allActiveAlerts]);

  const alertCoordinatesById = useAlertMapCoordinates(allActiveAlerts);
  const homeCoordinates = useRegisteredHomeCoordinates(address);

  const mapMarkers = useMemo(() => {
    const baseMarkers = filterMapMarkersByAllowedStates(
      Array.isArray(emergency?.mapMarkers) ? emergency.mapMarkers : [],
      allowedTokens,
    );

    const alertMarkers = allActiveAlerts
      .map((alert): MapMarkerPoint | null => {
        const coords = alertCoordinatesById.get(alert.id);
        if (!coords) return null;

        const separated = separateFromReference(coords, homeCoordinates);

        return {
          id: alert.id,
          title: alert.title || alert.name || 'Alert',
          description: alert.location,
          latitude: separated.lat,
          longitude: separated.lng,
          severity: alert.severity,
          layer: 'alerts',
          type: 'alert',
        };
      })
      .filter((marker): marker is MapMarkerPoint => marker !== null);

    return [...baseMarkers, ...alertMarkers];
  }, [emergency?.mapMarkers, allActiveAlerts, allowedTokens, alertCoordinatesById, homeCoordinates]);

  const filteredMapRegion = useMemo(() => {
    if (!emergency) return undefined;
    const baseRegion = resolveMapRegion(emergency.mapRegion, address);

    const regionPoints = mapMarkers.map((marker) => ({
      latitude: marker.latitude,
      longitude: marker.longitude,
    }));

    if (homeCoordinates) {
      regionPoints.push({
        latitude: homeCoordinates.lat,
        longitude: homeCoordinates.lng,
      });
    }

    return calculateRegionForMarkers(regionPoints, baseRegion);
  }, [emergency, mapMarkers, address, homeCoordinates]);

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
          <DisruptionStatusBanner status={home?.status} onViewSituation={scrollToSituation} />
        ) : (
          <BlueSkyStatusBanner status={home?.status} />
        )}

        <View style={styles.sectionHeader}>
          <AppText variant="h3" color={colors.primary}>
            Citizen Assistant
          </AppText>
        </View>
        <CitizenAssistantHomeCard onPress={navigateToCitizenAssistance} />

        {hasOpenIda && idaInvitation ? (
          <IdaHomeCard
            title="Initial Disaster Assistance"
            subtitle={idaInvitation.campaign.title}
            cta={
              idaInvitation.status === 'needs_info'
                ? 'Tap to add missing details'
                : 'Tap to complete your application'
            }
            onPress={() => void navigateToIdaIfActive()}
          />
        ) : null}

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
                  region={filteredMapRegion ?? emergency.mapRegion}
                  markers={mapMarkers}
                  overlays={emergency.mapOverlays}
                  variant={isCloudy ? 'situation' : 'area'}
                  userLocation={
                    homeCoordinates
                      ? { latitude: homeCoordinates.lat, longitude: homeCoordinates.lng }
                      : undefined
                  }
                  trackDeviceLocation={false}
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
            showImages={true}
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
