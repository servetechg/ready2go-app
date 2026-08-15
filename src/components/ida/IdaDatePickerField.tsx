import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, fontSize, inputHeight, spacing } from '@/theme';

const MIN_DOB = new Date(1900, 0, 1);

export function parseDob(value: string): Date | undefined {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return undefined;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getFullYear() !== year
  ) {
    return undefined;
  }
  return date;
}

export function formatDob(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
}

type IdaDatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function IdaDatePickerField({
  value,
  onChange,
  placeholder = 'Select date of birth',
}: IdaDatePickerFieldProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseDob(value), [value]);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Date of birth"
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <AppText
          variant="bodySmall"
          color={parsed ? colors.text : colors.textMuted}
          style={styles.value}
        >
          {parsed ? formatDob(parsed) : placeholder}
        </AppText>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </Pressable>

      <DateTimePickerModal
        isVisible={open}
        mode="date"
        date={parsed ?? new Date(1990, 0, 1)}
        maximumDate={today}
        minimumDate={MIN_DOB}
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        accentColor={colors.primary}
        buttonTextColorIOS={colors.primary}
        onConfirm={(next) => {
          onChange(formatDob(next));
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: inputHeight,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
});
