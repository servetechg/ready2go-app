import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { PreparednessTaskList } from '@/components/dashboard/PreparednessTaskList';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchCategoryDetail,
  fetchCategoryTasks,
} from '@/redux/slices/preparednessSlice';
import { spacing } from '@/theme';
import type { PreparednessStackParamList } from '@/types/navigation';
import { PREPAREDNESS_CATEGORY_NOT_FOUND_MESSAGE } from '@/utils/preparednessMessages';

type Route = RouteProp<
  PreparednessStackParamList,
  typeof PREPAREDNESS_STACK_ROUTES.CATEGORY
>;

export function PreparednessCategoryScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();

  const categoryId = params.categoryId;
  const detail = useAppSelector((s) => s.preparedness.categoryDetails[categoryId]);
  const tasks = useAppSelector((s) => s.preparedness.tasksByCategoryId[categoryId] ?? []);
  const tasksLoading = useAppSelector((s) => s.preparedness.tasksLoading[categoryId]);

  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCategory = async (force = false) => {
    setNotFound(false);
    setLoadError(null);

    const [detailResult, tasksResult] = await Promise.all([
      dispatch(fetchCategoryDetail(categoryId)),
      dispatch(fetchCategoryTasks({ categoryId, force })),
    ]);

    const detailRejected = fetchCategoryDetail.rejected.match(detailResult);
    const tasksRejected = fetchCategoryTasks.rejected.match(tasksResult);

    if (detailRejected || tasksRejected) {
      const payload = detailRejected ? detailResult.payload : tasksResult.payload;
      const message = typeof payload === 'string' ? payload : PREPAREDNESS_CATEGORY_NOT_FOUND_MESSAGE;

      if (message.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        setLoadError(message);
      }
    }
  };

  useEffect(() => {
    void loadCategory(false);
  }, [categoryId]);

  const reload = () => loadCategory(true);
  const { refreshControlProps } = usePullToRefresh(reload);

  const title = detail?.title ?? params.title;
  const intro =
    detail?.intro ??
    'Review local preparedness tasks for your area. Tap a task to expand details.';

  if (notFound) {
    return (
      <ScreenWrapper>
        <View style={styles.headerPad}>
          <AppHeader title={params.title} showBack={true} onBack={() => navigation.goBack()} />
        </View>
        <View style={styles.notFound}>
          <AppText variant="body" color={colors.textSecondary} center={true}>
            {PREPAREDNESS_CATEGORY_NOT_FOUND_MESSAGE}
          </AppText>
          <AppButton title="GO BACK" onPress={() => navigation.goBack()} style={styles.backBtn} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title={title} showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl {...refreshControlProps} />}>
        <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
          {intro}
        </AppText>

        {tasksLoading && tasks.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {loadError && tasks.length === 0 && !tasksLoading ? (
          <AppText variant="body" color={colors.error} style={styles.error}>
            {loadError}
          </AppText>
        ) : null}

        <PreparednessTaskList tasks={tasks} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: 100 },
  intro: { marginBottom: spacing.lg },
  loader: { marginBottom: spacing.lg },
  error: { marginBottom: spacing.lg },
  notFound: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  backBtn: { marginTop: spacing.md },
});
