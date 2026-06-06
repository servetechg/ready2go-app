import React from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/redux/hooks';
import { spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';
import { getPreparednessListEmptyMessage } from '@/utils/preparednessMessages';

interface PreparednessEmptyMessageProps {
  hasSearch: boolean;
}

export function PreparednessEmptyMessage({ hasSearch }: PreparednessEmptyMessageProps) {
  const { colors } = useAppTheme();
  const profileComplete = toBoolean(useAppSelector((s) => s.auth.user?.profileComplete));

  return (
    <AppText variant="body" color={colors.textSecondary} center={true} style={styles.message}>
      {getPreparednessListEmptyMessage(profileComplete, hasSearch)}
    </AppText>
  );
}

const styles = StyleSheet.create({
  message: { marginVertical: spacing.lg },
});
