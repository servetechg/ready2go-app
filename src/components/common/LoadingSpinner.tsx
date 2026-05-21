import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/theme';
import { toBoolean } from '@/utils/coerce';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen }: LoadingSpinnerProps) {
  const isFullScreen = toBoolean(fullScreen);

  return (
    <View style={[styles.container, isFullScreen ? styles.fullScreen : undefined]}>
      <ActivityIndicator size="large" color={palette.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullScreen: { flex: 1, backgroundColor: palette.background },
  message: { marginTop: 12, color: palette.textSecondary, fontSize: 14 },
});
