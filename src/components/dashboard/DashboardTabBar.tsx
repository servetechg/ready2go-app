import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { TAB_ROUTES } from '@/constants/routes';
import { borderRadius, fontFamily, palette, shadows, spacing } from '@/theme';

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_CONFIG: Record<
  string,
  { label: string; icon: TabIconName; activeIcon: TabIconName }
> = {
  [TAB_ROUTES.HOME]: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  [TAB_ROUTES.ALERTS]: {
    label: 'Alerts',
    icon: 'thumbs-up-outline',
    activeIcon: 'thumbs-up',
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

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
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

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}>
              <Ionicons
                name={isFocused ? config.activeIcon : config.icon}
                size={24}
                color={isFocused ? palette.tabActive : palette.textMuted}
              />
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
    borderTopLeftRadius: borderRadius.xl + 8,
    borderTopRightRadius: borderRadius.xl + 8,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 48,
  },
  tabLabel: {
    fontFamily: fontFamily.semiBold,
    marginTop: 2,
  },
});
