import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { PREPAREDNESS_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import type { PreparednessStackParamList } from '@/types/navigation';

type Route = RouteProp<
  PreparednessStackParamList,
  typeof PREPAREDNESS_STACK_ROUTES.CATEGORY
>;

export function PreparednessCategoryScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const { colors } = useAppTheme();

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title={params.title} showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="body" color={colors.textSecondary}>
          No tasks available in this category yet. Content will sync from the preparedness guide
          when the API is connected.
        </AppText>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: 100 },
});
