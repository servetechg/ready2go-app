import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { palette } from '@/theme';
import { typography } from '@/theme';
import { toBoolean } from '@/utils/coerce';
import { sanitizeTextProps } from '@/utils/nativeProps';

type Variant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
}

export function AppText({
  variant = 'body',
  color,
  center = false,
  style,
  children,
  ...props
}: AppTextProps) {
  const isCenter = toBoolean(center);
  const nativeProps = sanitizeTextProps(props);

  return (
    <Text
      style={[
        typography[variant],
        { color: color ?? palette.text },
        isCenter ? styles.center : undefined,
        style,
      ]}
      {...nativeProps}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
