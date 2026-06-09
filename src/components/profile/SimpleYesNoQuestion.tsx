import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppRadio } from '@/components/form/AppRadio';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

type SimpleYesNoQuestionProps = {
  question: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  error?: string;
};

export function SimpleYesNoQuestion({
  question,
  value,
  onChange,
  error,
}: SimpleYesNoQuestionProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.block}>
      <AppText variant="label" style={styles.question}>
        {question}
      </AppText>
      <AppRadio label="Yes" selected={value === true} onSelect={() => onChange(true)} />
      <AppRadio label="No" selected={value === false} onSelect={() => onChange(false)} />
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  question: {
    marginBottom: spacing.xs,
  },
});
