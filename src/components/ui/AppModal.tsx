import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';

import { AppText } from './AppText';

interface AppModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function AppModal({ visible, title, message, onClose }: AppModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}>
          <AppText variant="h3">{title}</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.message}>
            {message}
          </AppText>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.primary }]}>
            <AppText variant="button" color={colors.textInverse}>
              OK
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
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
  content: {
    width: '100%',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  message: { marginVertical: spacing.sm },
  closeBtn: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
