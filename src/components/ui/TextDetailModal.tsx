import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';

import { AppText } from './AppText';

interface TextDetailModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  body: string;
  onClose: () => void;
}

export function TextDetailModal({ visible, title, subtitle, body, onClose }: TextDetailModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="h3" color={colors.primary}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="caption" color={colors.textMuted} style={styles.subtitle}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}>
            <AppText variant="body" color={colors.textSecondary} selectable={true}>
              {body}
            </AppText>
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button">
            <AppText variant="button" color={colors.textInverse}>
              Close
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
    maxHeight: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  subtitle: { marginTop: spacing.xs },
  scroll: { marginTop: spacing.md },
  scrollContent: { paddingBottom: spacing.sm },
  closeBtn: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});
