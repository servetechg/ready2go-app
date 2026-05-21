export const palette = {
  primary: '#1B4F8A',
  primaryDark: '#fff',
  primaryLight: '#2E6BB5',
  secondary: '#4A90D9',
  accent: '#E8F4FC',
  white: '#FFFFFF',
  black: '#000000',
  background: '#F5F8FC',
  surface: '#FFFFFF',
  border: '#D1DCE8',
  borderLight: '#E8EEF4',
  text: '#1A2B3C',
  textSecondary: '#5A6B7D',
  textMuted: '#8A9BAB',
  textInverse: '#FFFFFF',
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#ED6C02',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(27, 79, 138, 0.12)',
  progressTrack: '#E0EAF4',
  progressFill: '#1B4F8A',
  trustBanner: '#0F3460',
} as const;

export type ColorScheme = 'light' | 'dark';

export type ThemeColors = { [K in keyof typeof palette]: string } & { mode: ColorScheme };

export const lightColors: ThemeColors = { ...palette, mode: 'light' };

export const darkColors: ThemeColors = {
  ...palette,
  mode: 'dark',
  background: '#0D1B2A',
  surface: '#1B2838',
  text: '#E8EEF4',
  textSecondary: '#A8B8C8',
  textMuted: '#6A7B8D',
  border: '#2A3F55',
  borderLight: '#1E3045',
  accent: '#1E3045',
  progressTrack: '#2A3F55',
};

