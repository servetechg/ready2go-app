import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
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
import { PREPAREDNESS_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchCategoryDetail,
  fetchCategoryTasks,
} from '@/redux/slices/preparednessSlice';
import { borderRadius, spacing } from '@/theme';
import type { PreparednessStackParamList } from '@/types/navigation';
import { preparednessIconName } from '@/utils/preparednessIcons';
import {
  formatPreparednessIntro,
  formatPreparednessText,
  formatPreparednessTitle,
} from '@/utils/preparednessLabels';
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
  const categories = useAppSelector((s) => s.preparedness.categories);
  const tasks = useAppSelector((s) => s.preparedness.tasksByCategoryId[categoryId] ?? []);
  const tasksLoading = useAppSelector((s) => s.preparedness.tasksLoading[categoryId]);

  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const categoryMeta = useMemo(
    () => detail ?? categories.find((category) => category.id === categoryId),
    [categories, categoryId, detail],
  );

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

  const title = formatPreparednessTitle(detail?.title ?? params.title, categoryId);
  const intro = formatPreparednessIntro(detail?.intro);
  const subtitle = categoryMeta?.subtitle
    ? formatPreparednessText(categoryMeta.subtitle)
    : null;
  const iconName = preparednessIconName(categoryMeta?.icon ?? 'shield');

  if (notFound) {
    return (
      <ScreenWrapper>
        <View style={styles.headerPad}>
          <AppHeader
            title={formatPreparednessTitle(params.title, categoryId)}
            showBack={true}
            onBack={() => navigation.goBack()}
          />
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
        <View style={[styles.summary, { backgroundColor: colors.accent }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
            <Ionicons name={iconName} size={22} color={colors.primary} />
          </View>
          <View style={styles.summaryText}>
            <AppText variant="body" color={colors.text} style={styles.summaryIntro}>
              {intro}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" color={colors.textSecondary} style={styles.summarySubtitle}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </View>

        {tasksLoading && tasks.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {loadError && tasks.length === 0 && !tasksLoading ? (
          <AppText variant="body" color={colors.error} style={styles.error}>
            {loadError}
          </AppText>
        ) : null}

        {!tasksLoading || tasks.length > 0 ? <PreparednessTaskList tasks={tasks} /> : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {},
  content: {
    paddingBottom: 100,
    gap: spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryIntro: {
    lineHeight: 22,
  },
  summarySubtitle: {
    lineHeight: 18,
  },
  loader: { marginVertical: spacing.xl },
  error: { marginBottom: spacing.lg },
  notFound: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  backBtn: { marginTop: spacing.md },
});
