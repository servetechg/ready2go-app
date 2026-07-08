import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { formatCategoryLabel, getCategoryStyle } from '@/components/dashboard/newsFeedStyles';
import { HOME_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, palette, shadows, spacing } from '@/theme';
import type { HomeStackParamList } from '@/types/navigation';
import type { NewsIconType, NewsSeverity } from '@/types/emergency';
import { formatIssuedDate } from '@/utils/formatTimestamp';

type NewsDetailRoute = RouteProp<HomeStackParamList, typeof HOME_STACK_ROUTES.NEWS_DETAIL>;
type NewsDetailNav = StackNavigationProp<HomeStackParamList, typeof HOME_STACK_ROUTES.NEWS_DETAIL>;

const SEVERITY_BORDER: Record<NewsSeverity, string> = {
  critical: '#C62828',
  warning: '#F9A825',
  info: '#90A4AE',
};

const DEFAULT_ICON: NewsIconType = 'newspaper-outline';

export function NewsDetailScreen() {
  const navigation = useNavigation<NewsDetailNav>();
  const { params } = useRoute<NewsDetailRoute>();
  const { colors } = useAppTheme();
  const { item } = params;

  const category = item.category ?? 'ADVISORY';
  const catStyle = getCategoryStyle(category);
  const iconName = item.icon ?? DEFAULT_ICON;
  const severityBorder = item.severity ? SEVERITY_BORDER[item.severity] : undefined;
  const sourceLabel = item.sourceName?.trim() || item.publisher?.trim();

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title="News" showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.card,
            shadows.sm,
            { backgroundColor: colors.surface },
            severityBorder ? { borderLeftWidth: 4, borderLeftColor: severityBorder } : null,
          ]}>
          <View style={styles.metaRow}>
            <View style={styles.badges}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: catStyle.bg, borderColor: catStyle.border },
                ]}>
                <AppText variant="caption" style={[styles.categoryText, { color: catStyle.text }]}>
                  {formatCategoryLabel(category)}
                </AppText>
              </View>
              <View style={styles.iconBadge}>
                <Ionicons name={iconName} size={16} color={colors.primary} />
              </View>
              {sourceLabel ? (
                <View style={[styles.sourceBadge, { borderColor: colors.secondary }]}>
                  <AppText variant="caption" color={colors.secondary} numberOfLines={1}>
                    {sourceLabel}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="caption" color={colors.textMuted} style={styles.issued}>
              {formatIssuedDate(item.timestamp)}
            </AppText>
          </View>

          {item.location ? (
            <AppText variant="caption" color={colors.textSecondary} style={styles.location}>
              {item.location}
            </AppText>
          ) : null}

          <AppText variant="h2" color={colors.primary} style={styles.title}>
            {item.title}
          </AppText>

          <AppText variant="body" color={colors.textSecondary} style={styles.body}>
            {item.body}
          </AppText>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {},
  content: { paddingBottom: spacing.xxxl },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    flex: 1,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    maxWidth: 120,
  },
  issued: { maxWidth: 140, textAlign: 'right' },
  location: {
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  title: { marginBottom: spacing.lg },
  body: { lineHeight: 24 },
});
