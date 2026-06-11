import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { TAB_ROUTES } from '@/constants/routes';
import { useAppSelector } from '@/redux/hooks';
import { selectUnreadAlertCount } from '@/redux/slices/alertsSlice';
import { borderRadius, fontFamily, palette, shadows, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_CONFIG: Record<
  string,
  { label: string; icon: TabIconName; activeIcon: TabIconName }
> = {
  [TAB_ROUTES.HOME]: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  [TAB_ROUTES.ALERTS]: {
    label: 'Alerts',
    icon: 'warning-outline',
    activeIcon: 'warning',
  },
  [TAB_ROUTES.PREPAREDNESS]: {
    label: 'Guide',
    icon: 'briefcase-outline',
    activeIcon: 'briefcase',
  },
  [TAB_ROUTES.PROFILE]: { label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
};

export function DashboardTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.xs);
  const unreadAlerts = useAppSelector(selectUnreadAlertCount);

  return (
    <View style={[styles.outer, { paddingBottom: bottomInset }]}>
      <View style={[styles.bar, shadows.lg]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? {
            label: route.name,
            icon: 'ellipse-outline' as TabIconName,
            activeIcon: 'ellipse' as TabIconName,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const showBadge = route.name === TAB_ROUTES.ALERTS && unreadAlerts > 0;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name={isFocused ? config.activeIcon : config.icon}
                  size={24}
                  color={isFocused ? palette.tabActive : palette.textMuted}
                />
                {showBadge ? (
                  <View style={styles.badge}>
                    <AppText variant="caption" style={styles.badgeText}>
                      {unreadAlerts > 99 ? '99+' : unreadAlerts}
                    </AppText>
                  </View>
                ) : null}
              </View>
              {isFocused ? (
                <AppText variant="caption" color={palette.tabActive} style={styles.tabLabel}>
                  {config.label}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: palette.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.badge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: 9,
    lineHeight: 12,
  },
  tabLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
  },
});
