import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppHeader } from './AppHeader';
import { ScreenWrapper } from './ScreenWrapper';

interface MainLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function MainLayout({ title, children }: MainLayoutProps) {
  return (
    <ScreenWrapper>
      <AppHeader title={title} />
      <View style={styles.content}>{children}</View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});
