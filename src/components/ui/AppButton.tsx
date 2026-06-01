import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';

import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface AppButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AppButton({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  size = 'md',
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const isLoading = toBoolean(loading);
  const isDisabled = toBoolean(disabled) || isLoading;

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    ghost: { backgroundColor: 'transparent' },
  };

  const textColor =
    variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        toBoolean(fullWidth) && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={isDisabled}
      accessibilityRole="button">
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <AppText variant="button" color={textColor} style={styles.uppercase}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const sizeStyles: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  uppercase: { textTransform: 'uppercase' },
});
