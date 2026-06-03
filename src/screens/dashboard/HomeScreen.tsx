import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AlertCard } from '@/components/dashboard/AlertCard';
import { BlueSkyNewsFeed } from '@/components/dashboard/BlueSkyNewsFeed';
import { BlueSkyStatusBanner } from '@/components/dashboard/BlueSkyStatusBanner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DisruptionStatusBanner } from '@/components/dashboard/DisruptionStatusBanner';
import { EmergencyMap } from '@/components/dashboard/EmergencyMap';
import { EmergencyNewsFeed } from '@/components/dashboard/EmergencyNewsFeed';
import { IncidentLog } from '@/components/dashboard/IncidentLog';
import { PreparednessCategoryCard } from '@/components/dashboard/PreparednessCategoryCard';
import { WeatherSummaryCard } from '@/components/dashboard/WeatherSummaryCard';
import { AppText } from '@/components/ui/AppText';
import { PREPAREDNESS_CATEGORIES } from '@/constants/dashboard';
import {
  HOME_STACK_ROUTES,
  PREPAREDNESS_STACK_ROUTES,
  TAB_ROUTES,
} from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useEmergencyDashboard } from '@/hooks/useEmergencyDashboard';
import { navigateToAlertsTab } from '@/navigation/navigationHelpers';
import { useAppSelector } from '@/redux/hooks';
import { spacing } from '@/theme';
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
  const { isCloudy, emergency, loading } = useEmergencyDashboard();

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PREPAREDNESS_CATEGORIES;
    return PREPAREDNESS_CATEGORIES.filter((c) => c.title.toLowerCase().includes(q));
  }, [searchQuery]);

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
        contentContainerStyle={styles.scroll}>
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
            {isCloudy ? (
              <View
                style={styles.emergencyBlock}
                onLayout={(e) => {
                  mapSectionY.current = e.nativeEvent.layout.y;
                }}>
                <EmergencyMap region={emergency.mapRegion} markers={emergency.mapMarkers} />
                <IncidentLog entries={emergency.incidentLog} />
                <EmergencyNewsFeed items={emergency.news} title="Emergency updates" />
              </View>
            ) : (
              <BlueSkyNewsFeed items={emergency.news} maxVisible={4} />
            )}
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
        </View>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
          Review preparedness tasks grouped by category. This view is read-only.
        </AppText>
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
