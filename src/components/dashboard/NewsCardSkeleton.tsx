import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

/**
 * Animated News Card Skeleton Loader component.
 * Renders pulse-animated placeholders while news is loading.
 */
export function NewsCardSkeleton() {
  const { colors } = useAppTheme();
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  const skeletonStyle = {
    backgroundColor: colors.border,
    opacity: opacityAnim,
  };

  return (
    <AppCard style={styles.card}>
      <Animated.View style={[styles.imagePlaceholder, skeletonStyle]} />
      <View style={styles.bodyPad}>
        <View style={styles.metaRow}>
          <Animated.View style={[styles.sourceIcon, skeletonStyle]} />
          <Animated.View style={[styles.sourceName, skeletonStyle]} />
          <Animated.View style={[styles.dateText, skeletonStyle]} />
        </View>
        <Animated.View style={[styles.titleLine1, skeletonStyle]} />
        <Animated.View style={[styles.titleLine2, skeletonStyle]} />
        <Animated.View style={[styles.descLine1, skeletonStyle]} />
        <Animated.View style={[styles.descLine2, skeletonStyle]} />
        <View style={styles.footerRow}>
          <Animated.View style={[styles.buttonSkeleton, skeletonStyle]} />
        </View>
      </View>
    </AppCard>
  );
}

export function NewsFeedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listWrap}>
      {Array.from({ length: count }).map((_, index) => (
        <NewsCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 180,
    width: '100%',
  },
  bodyPad: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  sourceIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  sourceName: {
    width: 110,
    height: 12,
    borderRadius: 6,
  },
  dateText: {
    width: 70,
    height: 12,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  titleLine1: {
    height: 16,
    width: '92%',
    borderRadius: 8,
    marginTop: 2,
  },
  titleLine2: {
    height: 16,
    width: '70%',
    borderRadius: 8,
  },
  descLine1: {
    height: 12,
    width: '95%',
    borderRadius: 6,
    marginTop: 4,
  },
  descLine2: {
    height: 12,
    width: '60%',
    borderRadius: 6,
  },
  footerRow: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  buttonSkeleton: {
    width: 110,
    height: 14,
    borderRadius: 7,
  },
});
