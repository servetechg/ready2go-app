import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { MAIN_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import {
  navigateToCitizenAssistance,
  navigateToDisasterSurveyIfActive,
} from '@/navigation/navigationRef';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchInboxNotifications,
  markAllInboxNotificationsRead,
  markInboxNotificationRead,
} from '@/redux/slices/notificationsSlice';
import { borderRadius, spacing } from '@/theme';
import type { InboxNotificationItem, InboxNotificationType } from '@/types/notifications';
import type { MainStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.NOTIFICATIONS>;

const TYPE_ICONS: Record<InboxNotificationType, keyof typeof Ionicons.glyphMap> = {
  citizen_activity: 'people',
  citizen_report_resolved: 'checkmark-circle',
  alert_dispatched: 'warning',
  disaster_survey: 'document-text',
  ai_report: 'sparkles',
  responder_approval: 'shield',
  system: 'notifications',
};

function NotificationCard({
  item,
  onPress,
}: {
  item: InboxNotificationItem;
  onPress: (item: InboxNotificationItem) => void;
}) {
  const { colors } = useAppTheme();
  const icon = TYPE_ICONS[item.type] ?? 'notifications';

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !item.read && { borderLeftColor: colors.primary, borderLeftWidth: 3 },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <AppText variant="label" style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {item.displayTime}
          </AppText>
        </View>
        <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={3}>
          {item.body}
        </AppText>
      </View>
      {!item.read ? <View style={[styles.unreadDot, { backgroundColor: colors.error }]} /> : null}
    </Pressable>
  );
}

function ListHeader({
  unreadCount,
  onMarkAllRead,
}: {
  unreadCount: number;
  onMarkAllRead: () => void;
}) {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();

  return (
    <View>
      <AppHeader
        showBack
        onBack={() => navigation.goBack()}
        title="Notifications"
        rightElement={
          unreadCount > 0 ? (
            <Pressable onPress={onMarkAllRead} hitSlop={8}>
              <AppText variant="label" color={colors.primary}>
                Mark all read
              </AppText>
            </Pressable>
          ) : undefined
        }
      />
      <AppText variant="caption" color={colors.textSecondary} style={styles.lead}>
        Updates on your reports, surveys, and account — emergency weather alerts stay on the Alerts
        tab.
      </AppText>
    </View>
  );
}

export function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { items, loading, error, unreadCount } = useAppSelector((s) => s.notifications);

  const reload = useCallback(() => {
    void dispatch(fetchInboxNotifications());
  }, [dispatch]);

  useEffect(() => {
    reload();
  }, [reload]);

  const { refreshControlProps } = usePullToRefresh(reload);

  const handlePress = useCallback(
    (item: InboxNotificationItem) => {
      if (!item.read) {
        void dispatch(markInboxNotificationRead(item.id));
      }
      if (item.type === 'citizen_report_resolved') {
        navigateToCitizenAssistance();
        return;
      }
      if (item.type === 'disaster_survey') {
        void navigateToDisasterSurveyIfActive();
      }
    },
    [dispatch],
  );

  const handleMarkAllRead = useCallback(() => {
    void dispatch(markAllInboxNotificationsRead());
  }, [dispatch]);

  const listEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
        <AppText variant="body" color={colors.textSecondary} center style={styles.emptyText}>
          {error ?? 'No notifications yet.'}
        </AppText>
      </View>
    );
  }, [colors.primary, colors.textMuted, colors.textSecondary, error, loading]);

  return (
    <ScreenWrapper scrollable={false} keyboardAvoiding={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl {...refreshControlProps} />}
        ListHeaderComponent={
          <ListHeader unreadCount={unreadCount} onMarkAllRead={handleMarkAllRead} />
        }
        renderItem={({ item }) => <NotificationCard item={item} onPress={handlePress} />}
        ListEmptyComponent={listEmpty}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xxl, flexGrow: 1 },
  lead: { marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: { flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: { marginTop: spacing.sm },
});
