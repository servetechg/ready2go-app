import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, palette, shadows, spacing } from '@/theme';
import type { EmergencyNewsItem, NewsCategory, NewsIconType } from '@/types/emergency';
import { formatRelativeTime } from '@/utils/formatTimestamp';

interface BlueSkyNewsFeedProps {
  items: EmergencyNewsItem[];
  maxVisible?: number;
}

const CATEGORY_STYLES: Record<
  NewsCategory,
  { bg: string; text: string; border: string }
> = {
  ADVISORY: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  PREPAREDNESS: { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  ADMIN: { bg: '#EDE7F6', text: '#4527A0', border: '#B39DDB' },
  REGIONAL: { bg: palette.accent, text: palette.tabActive, border: palette.border },
};

const DEFAULT_ICON: NewsIconType = 'newspaper-outline';

function NewsFeedCard({ item }: { item: EmergencyNewsItem }) {
  const { colors } = useAppTheme();
  const category = item.category ?? 'ADVISORY';
  const catStyle = CATEGORY_STYLES[category];
  const iconName = item.icon ?? DEFAULT_ICON;
  const sourceLabel = item.source === 'admin' ? 'ADMIN' : 'READY2GO';

  return (
    <View style={[styles.card, shadows.sm, { backgroundColor: colors.surface }]}>
      <View style={styles.topRow}>
        <View style={styles.badges}>
          <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg, borderColor: catStyle.border }]}>
            <AppText variant="caption" style={[styles.categoryText, { color: catStyle.text }]}>
              {category}
            </AppText>
          </View>
          <View style={styles.iconBadge}>
            <Ionicons name={iconName} size={16} color={colors.primary} />
          </View>
          <View style={[styles.sourceBadge, { borderColor: colors.secondary }]}>
            <AppText variant="caption" color={colors.secondary}>
              SOURCE: {sourceLabel}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" color={colors.textMuted} style={styles.issued}>
          {formatRelativeTime(item.timestamp)}
        </AppText>
      </View>

      <AppText variant="h3" color={colors.primary} style={styles.headline}>
        {item.title}
      </AppText>

      {item.location ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.location}>
          {item.location}
        </AppText>
      ) : null}

      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.body}>
        {item.body}
      </AppText>
    </View>
  );
}

export function BlueSkyNewsFeed({ items, maxVisible = 4 }: BlueSkyNewsFeedProps) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [items],
  );

  const visible = expanded ? sorted : sorted.slice(0, maxVisible);
  const hasMore = sorted.length > maxVisible;

  if (sorted.length === 0) {
    return (
      <View style={[styles.emptyCard, shadows.sm, { backgroundColor: colors.surface }]}>
        <Ionicons name="newspaper-outline" size={28} color={colors.textMuted} />
        <AppText variant="body" color={colors.textSecondary} center={true} style={styles.emptyText}>
          No emergency news at this time. Check back for regional advisories and administrator
          messages.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="h3" color={colors.primary}>
          Emergency News
        </AppText>
        {hasMore ? (
          <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8}>
            <AppText variant="label" color={colors.primary}>
              {expanded ? 'Show less' : 'View all'}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
        Emergency-related updates and messages from administrators only.
      </AppText>

      {visible.map((item) => (
        <NewsFeedCard key={item.id} item={item} />
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
  },
  topRow: {
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
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  issued: { maxWidth: 88, textAlign: 'right' },
  headline: { marginBottom: spacing.xs },
  location: {
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  body: { lineHeight: 20 },
  emptyCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: { lineHeight: 22 },
});
