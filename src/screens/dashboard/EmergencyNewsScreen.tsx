import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { BlueSkyNewsFeed } from '@/components/dashboard/BlueSkyNewsFeed';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useEmergencyDashboard } from '@/hooks/useEmergencyDashboard';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { spacing } from '@/theme';

export function EmergencyNewsScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { emergency, loading, reload } = useEmergencyDashboard();
  const { refreshControlProps } = usePullToRefresh(reload);
  const items = emergency?.news ?? [];

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader
          title="Emergency News"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl {...refreshControlProps} />}>
        <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
          Emergency-related updates and messages from administrators. Regional advisories appear
          here even when there is no active disruption in your area.
        </AppText>

        {loading && items.length === 0 ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <BlueSkyNewsFeed items={items} showAll={true} showSectionHeader={false} />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {},
  content: { paddingBottom: spacing.xxxl },
  intro: { marginBottom: spacing.lg },
  loader: { marginVertical: spacing.xxl },
});
