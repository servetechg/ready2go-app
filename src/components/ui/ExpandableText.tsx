import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/theme';

import { AppText } from './AppText';
import { TextDetailModal } from './TextDetailModal';

interface ExpandableTextProps {
  text?: string | null;
  /** Heading shown at the top of the full-text modal. */
  modalTitle: string;
  modalSubtitle?: string;
  variant?: keyof typeof typography;
  color?: string;
  numberOfLines?: number;
  linkLabel?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Shows text clamped to `numberOfLines` and reveals the rest in a scrollable modal.
 * Feeds such as NWS alerts return very long area descriptions that would otherwise
 * push the rest of the screen out of view.
 */
export function ExpandableText({
  text,
  modalTitle,
  modalSubtitle,
  variant = 'bodySmall',
  color,
  numberOfLines = 3,
  linkLabel = 'See all',
  style,
}: ExpandableTextProps) {
  const { colors } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [measured, setMeasured] = useState<{ text: string; lines: number } | null>(null);

  const value = (text ?? '').trim();
  // Drop a stale measurement when the text changes instead of re-measuring in an effect.
  const totalLines = measured && measured.text === value ? measured.lines : null;

  if (!value) return null;

  const isClamped = totalLines !== null && totalLines > numberOfLines;

  return (
    <View>
      <AppText variant={variant} color={color} style={style} numberOfLines={numberOfLines}>
        {value}
      </AppText>

      {totalLines === null ? (
        <View pointerEvents="none" style={styles.measure}>
          <AppText
            variant={variant}
            style={style}
            onTextLayout={(e) => setMeasured({ text: value, lines: e.nativeEvent.lines.length })}>
            {value}
          </AppText>
        </View>
      ) : null}

      {isClamped ? (
        <Pressable
          onPress={() => setModalVisible(true)}
          hitSlop={8}
          style={styles.link}
          accessibilityRole="button"
          accessibilityLabel={`${linkLabel}: ${modalTitle}`}>
          <AppText variant="label" color={colors.primary}>
            {linkLabel}
          </AppText>
        </Pressable>
      ) : null}

      <TextDetailModal
        visible={modalVisible}
        title={modalTitle}
        subtitle={modalSubtitle}
        body={value}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'flex-start', marginTop: spacing.xs },
  measure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
    zIndex: -1,
  },
});
