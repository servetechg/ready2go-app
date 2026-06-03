/** PostScript names from @expo-google-fonts/google-sans */
export const fontFamily = {
  regular: 'GoogleSans_400Regular',
  medium: 'GoogleSans_500Medium',
  semiBold: 'GoogleSans_600SemiBold',
  bold: 'GoogleSans_700Bold',
} as const;

export type AppFontFamily = (typeof fontFamily)[keyof typeof fontFamily];
