import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

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
  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <DashboardTopBar showSearch={showSearch} />
      </View>
      <View style={[styles.content, tabBarInset && styles.tabBarInset]}>{children}</View>
    </ScreenWrapper>
  );
}

const TAB_BAR_CLEARANCE = 88;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  tabBarInset: {
    paddingBottom: TAB_BAR_CLEARANCE,
  },
});
