import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

import { DashboardTopBar } from './DashboardTopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  /** Extra bottom padding so content clears the floating tab bar */
  tabBarInset?: boolean;
}

export function DashboardLayout({
  children,
  showSearch = true,
  tabBarInset = true,
}: DashboardLayoutProps) {
  const { colors } = useAppTheme();

  return (
    <ScreenWrapper scrollable={false}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <DashboardTopBar showSearch={showSearch} />
        </View>
        <View style={[styles.content, tabBarInset && styles.tabBarInset]}>{children}</View>
      </View>
    </ScreenWrapper>
  );
}

const TAB_BAR_CLEARANCE = 72;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  tabBarInset: {
    // paddingBottom: TAB_BAR_CLEARANCE,
    // backgroundColor: 'grey',
  },
});
