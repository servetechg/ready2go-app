import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PreparednessTaskList } from '@/components/dashboard/PreparednessTaskList';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { getPreparednessTasksForCategory } from '@/constants/preparedness';
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
  const tasks = getPreparednessTasksForCategory(params.categoryId);

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title={params.title} showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
          Review these read-only preparedness steps for your household. Tap a task to expand
          details.
        </AppText>
        <PreparednessTaskList tasks={tasks} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: 100 },
  intro: { marginBottom: spacing.lg },
});
