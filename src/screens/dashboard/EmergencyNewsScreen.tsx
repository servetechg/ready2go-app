import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { NewsFeedCard } from '@/components/dashboard/BlueSkyNewsFeed';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { resolveStateLabel } from '@/constants/usStates';
import { HOME_STACK_ROUTES, PROFILE_STACK_ROUTES, TAB_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useEmergencyNews } from '@/hooks/useEmergencyNews';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { navigateToTab } from '@/navigation/navigationHelpers';
import { spacing } from '@/theme';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';

type EmergencyNewsNav = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, typeof HOME_STACK_ROUTES.EMERGENCY_NEWS>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function EmergencyNewsScreen() {
  const navigation = useNavigation<EmergencyNewsNav>();
  const { colors } = useAppTheme();
  const { items, loading, loadingMore, error, hasMore, stateCode, reload, loadMore } =
    useEmergencyNews();
  const { refreshControlProps } = usePullToRefresh(reload);

  const stateLabel = useMemo(() => resolveStateLabel(stateCode), [stateCode]);

  const goToProfile = useCallback(() => {
    navigation.goBack();
    navigateToTab(navigation, TAB_ROUTES.PROFILE, { screen: PROFILE_STACK_ROUTES.PROFILE });
  }, [navigation]);

  const openNewsDetail = useCallback(
    (item: (typeof items)[number]) => {
      navigation.navigate(HOME_STACK_ROUTES.NEWS_DETAIL, { item });
    },
    [navigation],
  );

  const emptyMessage = stateCode
    ? `No disaster news for ${stateLabel} right now.`
    : 'Add your state in Profile to see local disaster news.';

  const renderFooter = () => {
    if (loadingMore) {
      return <ActivityIndicator style={styles.footerLoader} color={colors.primary} />;
    }
    return null;
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <AppText variant="body" color={colors.textSecondary}>
        News Feed · {stateLabel}
      </AppText>
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.intro}>
        Headlines about earthquakes, wildfires, floods, and other disasters in your registered
        state.
      </AppText>
      {error ? (
        <AppText variant="bodySmall" color={colors.error} style={styles.error}>
          Could not load news. Pull to retry.
        </AppText>
      ) : null}
    </View>
  );

  const listEmpty = loading ? (
    <ActivityIndicator style={styles.loader} color={colors.primary} />
  ) : (
    <View style={styles.emptyWrap}>
      <AppText variant="body" color={colors.textSecondary} center={true}>
        {emptyMessage}
      </AppText>
      {!stateCode ? (
        <Pressable onPress={goToProfile} hitSlop={8} style={styles.emptyAction}>
          <AppText variant="label" color={colors.primary}>
            Go to Profile
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader
          title="News Feed"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsFeedCard item={item} onPress={() => openNewsDetail(item)} />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl {...refreshControlProps} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {},
  content: {
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  headerBlock: { marginBottom: spacing.lg },
  intro: { marginTop: spacing.sm },
  error: { marginTop: spacing.sm },
  loader: { marginVertical: spacing.xxl },
  footerLoader: { marginVertical: spacing.lg },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyAction: { marginTop: spacing.sm },
});
