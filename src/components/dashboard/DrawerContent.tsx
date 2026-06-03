import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import {
  DRAWER_ROUTES,
  HOME_STACK_ROUTES,
  MAIN_STACK_ROUTES,
  TAB_ROUTES,
} from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logoutUser } from '@/redux/slices/authSlice';
import { resetRegistration } from '@/redux/slices/registrationSlice';
import { borderRadius, palette, spacing } from '@/theme';
import { formatAddressLine } from '@/utils/formatAddress';

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function DrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const user = useAppSelector((s) => s.auth.user);
  const address = useAppSelector((s) => s.registration.address);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const addressLine = formatAddressLine(address);

  const goHome = () => {
    navigation.closeDrawer();
    navigation.navigate(DRAWER_ROUTES.MAIN, {
      screen: MAIN_STACK_ROUTES.TABS,
      params: {
        screen: TAB_ROUTES.HOME,
        params: { screen: HOME_STACK_ROUTES.HOME },
      },
    } as never);
  };

  const goWeatherAlerts = () => {
    navigation.closeDrawer();
    navigation.navigate(DRAWER_ROUTES.MAIN, {
      screen: MAIN_STACK_ROUTES.TABS,
      params: {
        screen: TAB_ROUTES.HOME,
        params: { screen: HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS },
      },
    } as never);
  };

  const goSettings = () => {
    navigation.closeDrawer();
    navigation.navigate(DRAWER_ROUTES.MAIN, {
      screen: MAIN_STACK_ROUTES.SETTINGS,
    } as never);
  };

  const openInfo = (title: string, body: string) => {
    navigation.closeDrawer();
    navigation.navigate(DRAWER_ROUTES.MAIN, {
      screen: MAIN_STACK_ROUTES.STATIC_INFO,
      params: { title, body },
    } as never);
  };

  const handleLogout = () => {
    navigation.closeDrawer();
    dispatch(logoutUser());
    dispatch(resetRegistration());
  };

  const menuItems: MenuItem[] = [
    { label: 'Home', icon: 'home', onPress: goHome },
    {
      label: 'Weather Alert Settings',
      icon: 'cloud-outline',
      onPress: goWeatherAlerts,
    },
    {
      label: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      onPress: () =>
        openInfo(
          'Privacy Policy',
          'Your privacy matters. Ready2Go collects registration and location data to deliver emergency alerts and preparedness guidance for your area.',
        ),
    },
    {
      label: 'About Us',
      icon: 'information-circle-outline',
      onPress: () =>
        openInfo(
          'About Us',
          'Ready2Go helps communities stay prepared with weather alerts, preparedness guides, and emergency resources.',
        ),
    },
    {
      label: 'Terms & Conditions',
      icon: 'document-text-outline',
      onPress: () =>
        openInfo(
          'Terms & Conditions',
          'By using Ready2Go you agree to receive emergency notifications and to provide accurate profile information.',
        ),
    },
    {
      label: 'Help & Feedback',
      icon: 'help-circle-outline',
      onPress: () =>
        openInfo(
          'Help & Feedback',
          'Contact your local emergency management office or app support for assistance.',
        ),
    },
    { label: 'Settings', icon: 'settings-outline', onPress: goSettings },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.lg, backgroundColor: colors.surface }]}>
      <Pressable
        style={[styles.closeBtn, { backgroundColor: palette.tabActive }]}
        onPress={() => navigation.closeDrawer()}
        accessibilityLabel="Close menu">
        <Ionicons name="close" size={22} color={palette.white} />
      </Pressable>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <AppText variant="h3" style={styles.name}>
            {fullName}
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} center={true}>
            {addressLine}
          </AppText>
        </View>

        {menuItems.map((item) => (
          <Pressable key={item.label} style={styles.menuRow} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color={palette.tabActive} />
            <AppText variant="body" style={styles.menuLabel}>
              {item.label}
            </AppText>
          </Pressable>
        ))}

        <Pressable style={[styles.menuRow, styles.logoutRow]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={palette.tabActive} />
          <AppText variant="body" style={styles.menuLabel}>
            Logout
          </AppText>
        </Pressable>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  closeBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.huge,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    marginTop: spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  name: { marginBottom: spacing.sm },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  menuLabel: { flex: 1 },
  logoutRow: { marginTop: spacing.xxxl },
});
