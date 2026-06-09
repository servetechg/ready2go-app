export const spacing = {
  xs: 4,
  sm: 8,
  smm: 7,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
} as const;

/** Standard horizontal inset for screen body/content. */
export const screenPaddingHorizontal = spacing.lg;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;
