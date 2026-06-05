import React from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontSize, googleSans, inputHeight, palette, spacing } from '@/theme';
import {
  formatUsPhoneInput,
  US_PHONE_DISPLAY_MAX_LENGTH,
  US_PHONE_DISPLAY_PLACEHOLDER,
} from '@/utils/phone';
import { sanitizeTextInputProps } from '@/utils/nativeProps';

interface FormattedPhoneFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}

const FIELD_HEIGHT = inputHeight + 8;

export function FormattedPhoneField({ value, onChangeText, error }: FormattedPhoneFieldProps) {
  const { colors } = useAppTheme();

  const handleChange = (text: string) => {
    onChangeText(formatUsPhoneInput(text, value));
  };

  const nativeProps = sanitizeTextInputProps({
    value,
    onChangeText: handleChange,
    placeholder: US_PHONE_DISPLAY_PLACEHOLDER,
    placeholderTextColor: palette.textMuted,
    keyboardType: 'phone-pad',
    maxLength: US_PHONE_DISPLAY_MAX_LENGTH,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false as const } : {}),
  });

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.textSecondary} style={styles.label}>
        Phone
      </AppText>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
        ]}
        {...nativeProps}
      />
      {error ? (
        <AppText variant="caption" color={colors.error} style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs },
  input: {
    height: FIELD_HEIGHT,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    fontFamily: googleSans.regular,
    fontSize: fontSize.md,
  },
  error: { marginTop: spacing.xs },
});
