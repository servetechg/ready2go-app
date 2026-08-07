import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { NewsFeedSkeletonList } from '@/components/dashboard/NewsCardSkeleton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePersonalizedNews } from '@/hooks/usePersonalizedNews';
import { spacing } from '@/theme';
import type {
  PersonalizedNewsArticle,
  PersonalizedNewsFeedProps,
} from '@/types/personalizedNews';
import { formatNewsTimestamp } from '@/utils/formatTimestamp';

/**
 * PersonalizedNewsFeed — Webz.io state-scoped disaster/weather news.
 */
export function PersonalizedNewsFeed({
  title = '',
  onArticlePress,
  scrollable = true,
  style,
  maxItems,
  showImages = true,
  showSectionHeader = false,
  onViewAll,
}: PersonalizedNewsFeedProps) {
  const { colors } = useAppTheme();
  const {
    articles,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    reload,
    loadMore,
  } = usePersonalizedNews();

  const visibleArticles = useMemo(() => {
    if (typeof maxItems === 'number' && maxItems > 0) {
      return articles.slice(0, maxItems);
    }
    return articles;
  }, [articles, maxItems]);

  const handlePressArticle = useCallback(
    async (article: PersonalizedNewsArticle) => {
      if (onArticlePress) {
        onArticlePress(article);
        return;
      }

      if (article.link) {
        try {
          const supported = await Linking.canOpenURL(article.link);
          if (supported) {
            await Linking.openURL(article.link);
          }
        } catch (err) {
          console.warn('Could not open article URL:', article.link, err);
        }
      }
    },
    [onArticlePress],
  );

  const renderHeader = () => {
    if (showSectionHeader) {
      return (
        <View style={styles.headerWrap}>
          <View style={styles.titleRow}>
            <AppText variant="h3" color={colors.primary} style={styles.titleText}>
              {title?.trim() || 'News Feed'}
            </AppText>
            {onViewAll && articles.length > 0 ? (
              <Pressable onPress={onViewAll} hitSlop={8}>
                <AppText variant="label" color={colors.primary}>
                  View all
                </AppText>
              </Pressable>
            ) : null}
          </View>
          {error ? (
            <AppText variant="bodySmall" color={colors.error} style={styles.errorText}>
              {error}
            </AppText>
          ) : null}
        </View>
      );
    }

    if (!title?.trim() && !error) return null;

    return (
      <View style={styles.headerWrap}>
        {title?.trim() ? (
          <View style={styles.titleRow}>
            <AppText variant="h3" color={colors.primary} style={styles.titleText}>
              {title}
            </AppText>
          </View>
        ) : null}
        {error ? (
          <AppText variant="bodySmall" color={colors.error} style={styles.errorText}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
  };

  const renderItem = ({ item }: { item: PersonalizedNewsArticle }) => (
    <AppCard style={styles.articleCard}>
      <Pressable
        onPress={() => handlePressArticle(item)}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.08)' }}
        style={styles.cardPressable}
      >
        {showImages ? (
          item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.borderLight }]}>
              <Ionicons name="newspaper-outline" size={28} color={colors.textMuted} />
            </View>
          )
        ) : null}

        <View style={styles.articleContent}>
          <View style={styles.metaRow}>
            <View style={styles.sourceWrap}>
              {item.source_icon && showImages ? (
                <Image source={{ uri: item.source_icon }} style={styles.sourceIcon} />
              ) : (
                <Ionicons name="journal-outline" size={12} color={colors.textSecondary} />
              )}
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={styles.sourceName}
                numberOfLines={1}
              >
                {item.source_name}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textMuted} style={styles.timestamp}>
              {formatNewsTimestamp(item.pubDate)}
            </AppText>
          </View>

          <AppText
            variant="label"
            color={showSectionHeader ? colors.primary : undefined}
            style={styles.headlineText}
            numberOfLines={2}
          >
            {item.title}
          </AppText>

          {item.description ? (
            <AppText
              variant="bodySmall"
              color={colors.textSecondary}
              style={styles.snippetText}
              numberOfLines={2}
            >
              {item.description}
            </AppText>
          ) : null}

          <View style={styles.actionRow}>
            <AppText variant="caption" color={colors.primary} style={styles.readMoreText}>
              Read Full Article →
            </AppText>
          </View>
        </View>
      </Pressable>
    </AppCard>
  );

  const renderFooter = () => {
    if (!scrollable || loadingMore) {
      if (loadingMore) {
        return (
          <View style={styles.footerLoaderWrap}>
            <ActivityIndicator color={colors.primary} size="small" />
            <AppText variant="caption" color={colors.textMuted} style={styles.footerLoaderText}>
              Loading more local news...
            </AppText>
          </View>
        );
      }
      return null;
    }
    return null;
  };

  const renderEmpty = () => {
    if (loading) {
      return <NewsFeedSkeletonList count={maxItems && maxItems > 0 ? Math.min(maxItems, 3) : 3} />;
    }

    return (
      <AppCard style={styles.emptyCard}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
        <AppText variant="body" color={colors.textSecondary} center={true} style={styles.emptyTitle}>
          No emergency news available right now.
        </AppText>
      </AppCard>
    );
  };

  if (!scrollable) {
    return (
      <View style={[styles.container, style]}>
        {renderHeader()}
        {visibleArticles.length === 0 ? (
          renderEmpty()
        ) : (
          <View style={styles.nonScrollList}>
            {visibleArticles.map((item) => (
              <React.Fragment key={item.article_id || item.link}>
                {renderItem({ item })}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={visibleArticles}
        keyExtractor={(item) => item.article_id || item.link}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={reload}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={
          typeof maxItems === 'number' ? undefined : hasMore ? loadMore : undefined
        }
        onEndReachedThreshold={0.4}
        style={styles.flexOne}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: 120,
    gap: spacing.md,
  },
  headerWrap: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  titleText: {
    fontWeight: '700',
  },
  errorText: {
    marginTop: spacing.xs,
  },
  articleCard: {
    padding: 0,
    overflow: 'hidden',
  },
  cardPressable: {
    padding: spacing.md,
  },
  thumbnailImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  articleContent: {
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sourceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  sourceIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  sourceName: {
    fontWeight: '600',
    flexShrink: 1,
  },
  timestamp: {
    flexShrink: 0,
  },
  headlineText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  snippetText: {
    lineHeight: 18,
  },
  actionRow: {
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  readMoreText: {
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  footerLoaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  footerLoaderText: {
    fontSize: 12,
  },
  nonScrollList: {
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
});
