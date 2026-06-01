import { TextStyle } from 'react-native';

import { fontFamily } from './fonts';

export { fontFamily } from './fonts';

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    lineHeight: fontSize.display * lineHeight.tight,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxxl,
    lineHeight: fontSize.xxxl * lineHeight.tight,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl * lineHeight.tight,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.relaxed,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.relaxed,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  button: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    letterSpacing: 0.5,
  },
};

/** Use on raw Text that are not wrapped in AppText */
export const defaultTextStyle: TextStyle = {
  fontFamily: fontFamily.regular,
  fontSize: fontSize.md,
};

/** Compact style for TextInput — avoids tall boxes with custom fonts on Android */
export const inputTextStyle: TextStyle = {
  fontFamily: fontFamily.regular,
  fontSize: fontSize.md,
  lineHeight: fontSize.md + 2,
};

export const inputHeight = 40;
