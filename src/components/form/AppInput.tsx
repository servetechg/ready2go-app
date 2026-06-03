import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, inputHeight, inputTextStyle, spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';
import { sanitizeTextInputProps } from '@/utils/nativeProps';

import { ErrorMessage } from '../common/ErrorMessage';
import { AppText } from '../ui/AppText';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

function inputTextValue(value: TextInputProps['value']): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return '';
}

export function AppInput({
  label,
  error,
  containerStyle,
  style,
  secureTextEntry,
  value,
  ...props
}: AppInputProps) {
  const { colors } = useAppTheme();
  const isSecure = toBoolean(secureTextEntry);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const hidePassword = isSecure && !passwordVisible;

  const nativeProps = sanitizeTextInputProps({
    ...props,
    value: inputTextValue(value),
    secureTextEntry: hidePassword,
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            isSecure && styles.inputWithIcon,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.error : colors.border,
              color: colors.text,
            },
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          textAlignVertical="center"
          {...(Platform.OS === 'android' ? { includeFontPadding: false as const } : {})}
          {...nativeProps}
        />
        {isSecure ? (
          <Pressable
            style={styles.toggle}
            onPress={() => setPasswordVisible((visible) => !visible)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}>
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      <ErrorMessage message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    ...inputTextStyle,
    height: inputHeight,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
  },
  inputWithIcon: {
    paddingRight: spacing.lg + 28,
  },
  toggle: {
    position: 'absolute',
    right: spacing.md,
    height: inputHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
