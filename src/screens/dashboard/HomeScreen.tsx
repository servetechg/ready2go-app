import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AlertCard } from '@/components/dashboard/AlertCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PreparednessCategoryCard } from '@/components/dashboard/PreparednessCategoryCard';
import { WeatherSummaryCard } from '@/components/dashboard/WeatherSummaryCard';
import { AppText } from '@/components/ui/AppText';
import { PREPAREDNESS_CATEGORIES } from '@/constants/dashboard';
import {
  HOME_STACK_ROUTES,
  PREPAREDNESS_STACK_ROUTES,
  TAB_ROUTES,
} from '@/constants/routes';
import { navigateToAlertsTab } from '@/navigation/navigationHelpers';
import { useAppTheme } from '@/hooks/useAppTheme';
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
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);
  const alerts = useAppSelector((s) => s.dashboard.alerts);

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

  return (
    <DashboardLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <WeatherSummaryCard
          onPress={() => navigation.navigate(HOME_STACK_ROUTES.WEATHER)}
          onAlertSettingsPress={() =>
            navigation.navigate(HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS)
          }
        />

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
  scroll: { paddingBottom: spacing.xl },
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
