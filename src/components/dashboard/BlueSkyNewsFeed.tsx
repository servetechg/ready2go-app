import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatCategoryLabel, getCategoryStyle } from '@/components/dashboard/newsFeedStyles';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, palette, shadows, spacing } from '@/theme';
import type { EmergencyNewsItem, NewsIconType, NewsSeverity } from '@/types/emergency';
import { formatRelativeTime } from '@/utils/formatTimestamp';

interface BlueSkyNewsFeedProps {
  items: EmergencyNewsItem[];
  maxVisible?: number;
  /** When set, "View all" navigates instead of expanding inline. */
  onViewAll?: () => void;
  /** Called when a news card is tapped. */
  onItemPress?: (item: EmergencyNewsItem) => void;
  /** Hide section title/subtitle (e.g. full-screen view has its own header). */
  showSectionHeader?: boolean;
  /** List every item (full-screen feed). */
  showAll?: boolean;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

const SEVERITY_BORDER: Record<NewsSeverity, string> = {
  critical: '#C62828',
  warning: '#F9A825',
  info: '#90A4AE',
};

const DEFAULT_ICON: NewsIconType = 'newspaper-outline';

interface NewsFeedCardProps {
  item: EmergencyNewsItem;
  onPress?: () => void;
}

export function NewsFeedCard({ item, onPress }: NewsFeedCardProps) {
  const { colors } = useAppTheme();
  const category = item.category ?? 'ADVISORY';
  const catStyle = getCategoryStyle(category);
  const iconName = item.icon ?? DEFAULT_ICON;
  const severityBorder = item.severity ? SEVERITY_BORDER[item.severity] : undefined;
  const sourceLabel = item.sourceName?.trim() || item.publisher?.trim();

  const content = (
    <View
      style={[
        styles.card,
        shadows.sm,
        { backgroundColor: colors.surface },
        severityBorder ? { borderLeftWidth: 4, borderLeftColor: severityBorder } : null,
      ]}>
      <View style={styles.topRow}>
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
          {formatRelativeTime(item.timestamp)}
        </AppText>
      </View>

      <AppText variant="h3" color={colors.primary} style={styles.headline} numberOfLines={2}>
        {item.title}
      </AppText>

      {item.location ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.location}>
          {item.location}
        </AppText>
      ) : null}

      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.body} numberOfLines={3}>
        {item.body}
      </AppText>

      {onPress ? (
        <AppText variant="label" color={colors.primary} style={styles.readMore}>
          Read more
        </AppText>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

export function BlueSkyNewsFeed({
  items,
  maxVisible = 4,
  onViewAll,
  onItemPress,
  showSectionHeader = true,
  showAll = false,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
}: BlueSkyNewsFeedProps) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [items],
  );

  const showAllInline = showAll || expanded || maxVisible >= sorted.length;
  const visible = showAllInline ? sorted : sorted.slice(0, maxVisible);
  const hasMore = !showAll && sorted.length > maxVisible;

  if (sorted.length === 0) {
    return (
      <View style={[styles.emptyCard, shadows.sm, { backgroundColor: colors.surface }]}>
        <Ionicons name="newspaper-outline" size={28} color={colors.textMuted} />
        <AppText variant="body" color={colors.textSecondary} center={true} style={styles.emptyText}>
          {emptyMessage ??
            'No disaster news right now. Pull to refresh for the latest headlines in your area.'}
        </AppText>
        {emptyActionLabel && onEmptyAction ? (
          <Pressable onPress={onEmptyAction} hitSlop={8}>
            <AppText variant="label" color={colors.primary}>
              {emptyActionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
      return;
    }
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.section}>
      {showSectionHeader ? (
        <>
          <View style={styles.sectionHeader}>
            <AppText variant="h3" color={colors.primary}>
              News Feed
            </AppText>
            {hasMore ? (
              <Pressable onPress={handleViewAll} hitSlop={8}>
                <AppText variant="label" color={colors.primary}>
                  {onViewAll ? 'View all' : expanded ? 'Show less' : 'View all'}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
            State-scoped disaster headlines from trusted news sources.
          </AppText>
        </>
      ) : null}

      {visible.map((item) => (
        <NewsFeedCard
          key={item.id}
          item={item}
          onPress={onItemPress ? () => onItemPress(item) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: { marginBottom: spacing.lg },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
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
  issued: { maxWidth: 88, textAlign: 'right' },
  headline: { marginBottom: spacing.xs },
  location: {
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  body: { lineHeight: 20 },
  readMore: { marginTop: spacing.sm },
  emptyCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: { lineHeight: 22 },
});
