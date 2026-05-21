import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';
import { sanitizeTextInputProps } from '@/utils/nativeProps';

import { AppText } from '../ui/AppText';
import { ErrorMessage } from '../common/ErrorMessage';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

export function AppInput({
  label,
  error,
  containerStyle,
  style,
  secureTextEntry,
  ...props
}: AppInputProps) {
  const { colors } = useAppTheme();

  const nativeProps = sanitizeTextInputProps({
    ...props,
    secureTextEntry: secureTextEntry === true,
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...nativeProps}
      />
      <ErrorMessage message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
});
