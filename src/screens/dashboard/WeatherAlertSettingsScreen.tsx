import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchWeatherAlertPreferences,
  saveWeatherAlertPreference,
} from '@/redux/slices/dashboardSlice';
import { spacing } from '@/theme';
import type { WeatherAlertPreference } from '@/types/dashboard';

const CATEGORY_ORDER = ['Severe', 'Winter', 'Coastal', 'Fire/Heat', 'Other'] as const;

export function WeatherAlertSettingsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { showError } = useToast();
  const preferences = useAppSelector((s) => s.dashboard.weatherAlertPreferences);
  const loading = useAppSelector((s) => s.dashboard.weatherPreferencesLoading);
  const error = useAppSelector((s) => s.dashboard.weatherPreferencesError);

  useEffect(() => {
    void dispatch(fetchWeatherAlertPreferences()).then((result) => {
      if (fetchWeatherAlertPreferences.rejected.match(result)) {
        showError(
          (result.payload as string) ?? 'Could not load weather alert preferences',
        );
      }
    });
  }, [dispatch, showError]);

  const grouped = useMemo(() => {
    const map = new Map<string, WeatherAlertPreference[]>();
    for (const pref of preferences) {
      const key = pref.category?.trim() || 'Other';
      const list = map.get(key) ?? [];
      list.push(pref);
      map.set(key, list);
    }
    const ordered: { category: string; items: WeatherAlertPreference[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = map.get(cat);
      if (items?.length) ordered.push({ category: cat, items });
      map.delete(cat);
    }
    for (const [category, items] of map) {
      ordered.push({ category, items });
    }
    return ordered;
  }, [preferences]);

  const handleToggle = useCallback(
    (id: string, enabled: boolean) => {
      void dispatch(saveWeatherAlertPreference({ id, enabled })).then((result) => {
        if (saveWeatherAlertPreference.rejected.match(result)) {
          showError((result.payload as string) ?? 'Could not save preference');
        }
      });
    },
    [dispatch, showError],
  );

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader
          title="Weather Alerts"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
          Choose which NWS watches and warnings you want for your registered locations.
          All major national weather alert types are listed below.
        </AppText>

        {loading && preferences.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
            <AppText variant="body" color={colors.textSecondary} style={styles.loadingText}>
              Loading alert types…
            </AppText>
          </View>
        ) : null}

        {error && preferences.length === 0 ? (
          <View style={styles.centered}>
            <AppText variant="body" color={colors.textSecondary} center={true}>
              {error}
            </AppText>
            <Pressable
              onPress={() => void dispatch(fetchWeatherAlertPreferences())}
              style={styles.retryBtn}>
              <AppText variant="label" color={colors.primary}>
                Try again
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {grouped.map((group) => (
          <View key={group.category} style={styles.section}>
            <AppText variant="label" color={colors.textMuted} style={styles.sectionTitle}>
              {group.category.toUpperCase()}
            </AppText>
            {group.items.map((pref) => (
              <AppCard key={pref.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.textCol}>
                    <AppText variant="label">{pref.label}</AppText>
                    <AppText variant="bodySmall" color={colors.textSecondary}>
                      {pref.description}
                    </AppText>
                  </View>
                  <Switch
                    value={pref.enabled}
                    onValueChange={(enabled) => handleToggle(pref.id, enabled)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              </AppCard>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {},
  content: { paddingBottom: spacing.xxxl },
  intro: { marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    marginBottom: spacing.sm,
    letterSpacing: 0.6,
  },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  textCol: { flex: 1 },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  loadingText: { marginTop: spacing.sm },
  retryBtn: { paddingVertical: spacing.sm },
});
