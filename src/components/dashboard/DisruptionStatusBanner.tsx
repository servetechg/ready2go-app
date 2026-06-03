import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { borderRadius, palette, shadows, spacing } from '@/theme';

interface DisruptionStatusBannerProps {
  onViewSituation?: () => void;
}

export function DisruptionStatusBanner({ onViewSituation }: DisruptionStatusBannerProps) {
  return (
    <View style={[styles.banner, shadows.md]}>
      <View style={styles.iconWrap}>
        <Ionicons name="cloudy" size={32} color="#C62828" />
        <View style={styles.sunDot}>
          <Ionicons name="sunny" size={14} color="#F9A825" />
        </View>
      </View>
      <View style={styles.textBlock}>
        <AppText variant="h3" color="#C62828" style={styles.title}>
          Active disruption in your area
        </AppText>
        <AppText variant="bodySmall" color={palette.textSecondary}>
          Severe weather and flooding reported.
        </AppText>
        <AppButton
          title="VIEW CURRENT SITUATION"
          onPress={onViewSituation}
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
  cta: { marginTop: spacing.sm },
});
