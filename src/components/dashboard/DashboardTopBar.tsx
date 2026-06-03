import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import React from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MenuIcon } from '@/components/icons/MenuIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { navigateToAlertsTab } from '@/navigation/navigationHelpers';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectUnreadAlertCount, setSearchQuery } from '@/redux/slices/dashboardSlice';
import { borderRadius, fontSize, googleSans, inputHeight, palette, spacing } from '@/theme';

interface DashboardTopBarProps {
  showSearch?: boolean;
}

export function DashboardTopBar({ showSearch = true }: DashboardTopBarProps) {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);
  const unreadCount = useAppSelector(selectUnreadAlertCount);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const openAlerts = () => {
    navigateToAlertsTab(navigation as NavigationProp<ParamListBase>);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={openDrawer} hitSlop={12} accessibilityLabel="Open menu">
        <MenuIcon size={26} color={colors.text} />
      </Pressable>

      {showSearch ? (
        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={(text) => dispatch(setSearchQuery(text))}
            placeholder="Search here.."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            textAlignVertical="center"
            {...(Platform.OS === 'android' ? { includeFontPadding: false as const } : {})}
          />
        </View>
      ) : (
        <View style={styles.searchPlaceholder} />
      )}

      <Pressable onPress={openAlerts} hitSlop={12} accessibilityLabel="Notifications">
        <Ionicons name="notifications-outline" size={26} color={colors.text} />
        {unreadCount > 0 ? <View style={styles.badge} /> : null}
      </Pressable>
    </View>
  );
}

interface DashboardScreenHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export function DashboardScreenHeader({ title, rightElement }: DashboardScreenHeaderProps) {
  const navigation = useNavigation();
  const { colors } = useAppTheme();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={styles.screenHeader}>
      <Pressable onPress={openDrawer} hitSlop={12} accessibilityLabel="Open menu">
        <MenuIcon size={26} color={colors.text} />
      </Pressable>
      <AppText variant="h3" style={styles.screenTitle}>
        {title}
      </AppText>
      <View style={styles.headerRight}>{rightElement ?? <View style={styles.headerSpacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    // borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    height: inputHeight,
    minHeight: inputHeight,
  },
  searchInput: {
    fontFamily: googleSans.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md + 2,
    flex: 1,
    padding: 0,
  },
  searchPlaceholder: { flex: 1 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.badge,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  headerSpacer: { width: 26 },
});
