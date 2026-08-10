import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  needsCount: number;
  onGoHome: () => void;
  /** Auto-dismiss + redirect after this many ms (default 3.5s). */
  autoDismissMs?: number;
};

const GREEN = '#16A34A';
const DEFAULT_AUTO_DISMISS_MS = 3500;

export function DisasterSurveyThankYouModal({
  visible,
  needsCount,
  onGoHome,
  autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
}: Props) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);
  const ring = useSharedValue(0.6);
  const dismissedRef = useRef(false);
  const onGoHomeRef = useRef(onGoHome);
  onGoHomeRef.current = onGoHome;

  const finish = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onGoHomeRef.current();
  };

  useEffect(() => {
    if (!visible) {
      dismissedRef.current = false;
      scale.value = 0.2;
      opacity.value = 0;
      ring.value = 0.6;
      return;
    }

    opacity.value = withTiming(1, { duration: 220 });
    scale.value = withSequence(
      withTiming(1.18, { duration: 280, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 10, stiffness: 160 }),
    );
    ring.value = withDelay(
      120,
      withTiming(1.35, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );

    const timer = setTimeout(() => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      onGoHomeRef.current();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, opacity, ring, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
    opacity: Math.max(0, 1.2 - ring.value),
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.iconStage}>
            <Animated.View
              style={[styles.ring, { borderColor: GREEN }, ringStyle]}
              pointerEvents="none"
            />
            <Animated.View style={iconStyle}>
              <Ionicons name="checkmark-circle" size={88} color={GREEN} />
            </Animated.View>
          </View>

          <AppText variant="h2" color={colors.primary} center style={styles.title}>
            Thank you
          </AppText>

          <AppText variant="body" color={colors.textSecondary} center style={styles.body}>
            Your disaster status survey has been submitted. Relief coordinators will review your
            responses for emergency lodging and funding assistance.
          </AppText>

          {needsCount > 0 ? (
            <AppText variant="bodySmall" color={colors.textMuted} center style={styles.summary}>
              {needsCount} immediate need{needsCount === 1 ? '' : 's'} reported
            </AppText>
          ) : null}

          <Pressable
            onPress={finish}
            style={[styles.button, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
          >
            <AppText variant="button" color={colors.textInverse} center style={styles.buttonLabel}>
              BACK TO HOME
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconStage: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
  },
  title: { marginBottom: spacing.md },
  body: { lineHeight: 24, marginBottom: spacing.md },
  summary: { marginBottom: spacing.lg },
  button: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    width: '100%',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
