import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, inputHeight, spacing } from '@/theme';

import { ErrorMessage } from '../common/ErrorMessage';
import { AppText } from '../ui/AppText';

interface AppSelectProps {
  label?: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: object;
  pill?: boolean;
}

export function AppSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  error,
  containerStyle,
  pill = false,
}: AppSelectProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <Pressable
        style={[
          styles.trigger,
          pill && styles.triggerPill,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        onPress={() => setOpen(true)}>
        <AppText
          variant="body"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.triggerText}
          color={value ? colors.text : colors.textMuted}>
          {typeof value === 'string' ? value || placeholder : placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={20} color={colors.primary} style={styles.chevron} />
      </Pressable>
      <ErrorMessage message={error} />

      <Modal
        visible={open === true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          onPress={() => setOpen(false)}>
          <View style={[styles.list, { backgroundColor: colors.surface }]}>
            <FlatList
              data={options as string[]}
              keyExtractor={(item) => item}
              nestedScrollEnabled={true}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}>
                  <AppText variant="body">{item}</AppText>
                  {value === item ? (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md, flex: 1 },
  label: { marginBottom: spacing.xs },
  trigger: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerPill: {
    height: inputHeight + 8,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: 0,
    borderWidth: 0,
  },
  triggerText: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.xs,
  },
  chevron: { flexShrink: 0 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  list: {
    maxHeight: 320,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EEF4',
  },
});
