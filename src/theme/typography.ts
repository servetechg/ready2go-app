import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: undefined as string | undefined,
  medium: undefined as string | undefined,
  bold: undefined as string | undefined,
};

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
  display: { fontSize: fontSize.display, fontWeight: '700', lineHeight: fontSize.display * lineHeight.tight },
  h1: { fontSize: fontSize.xxxl, fontWeight: '700', lineHeight: fontSize.xxxl * lineHeight.tight },
  h2: { fontSize: fontSize.xxl, fontWeight: '700', lineHeight: fontSize.xxl * lineHeight.tight },
  h3: { fontSize: fontSize.xl, fontWeight: '600', lineHeight: fontSize.xl * lineHeight.tight },
  body: { fontSize: fontSize.md, fontWeight: '400', lineHeight: fontSize.md * lineHeight.relaxed },
  bodySmall: { fontSize: fontSize.sm, fontWeight: '400', lineHeight: fontSize.sm * lineHeight.relaxed },
  label: { fontSize: fontSize.sm, fontWeight: '600', lineHeight: fontSize.sm * lineHeight.normal },
  caption: { fontSize: fontSize.xs, fontWeight: '400', lineHeight: fontSize.xs * lineHeight.normal },
  button: { fontSize: fontSize.md, fontWeight: '700', letterSpacing: 0.5 },
};
