import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { ExpandableText } from '@/components/ui/ExpandableText';
import { borderRadius, palette, shadows, spacing } from '@/theme';
import type { DashboardStatus } from '@/types/dashboard';
import { formatIssuedLabel } from '@/utils/formatTimestamp';

interface DisruptionStatusBannerProps {
  status?: DashboardStatus;
  onViewSituation?: () => void;
}

export function DisruptionStatusBanner({ status, onViewSituation }: DisruptionStatusBannerProps) {
  const headline = status?.headline ?? 'Active disruption in your area';
  const summary = status?.summary ?? 'Severe weather and flooding reported.';
  const updatedLabel = status?.updatedAt ? formatIssuedLabel(status.updatedAt) : null;

  return (
    <View style={[styles.banner, shadows.md]}>
      <View style={styles.iconWrap}>
        <Ionicons name="cloudy" size={32} color="#C62828" />
        <View style={styles.sunDot}>
          <Ionicons name="sunny" size={14} color="#F9A825" />
        </View>
      </View>
      <View style={styles.textBlock}>
        <AppText variant="h3" color="#C62828" style={styles.title} numberOfLines={2}>
          {headline}
        </AppText>
        <ExpandableText
          text={summary}
          modalTitle={headline}
          modalSubtitle={updatedLabel ?? undefined}
          color={palette.textSecondary}
          numberOfLines={3}
        />
        {updatedLabel ? (
          <AppText variant="caption" color={palette.textMuted}>
            {updatedLabel}
          </AppText>
        ) : null}
        <AppButton
          title="Current Status"
          onPress={onViewSituation}
          size="xs"
          fullWidth={false}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunDot: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  textBlock: { flex: 1, gap: spacing.sm },
  title: { marginBottom: 0 },
  cta: { marginTop: spacing.sm, alignSelf: 'flex-start', fontSize: 10 },
});
