import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCheckbox } from '@/components/form/AppCheckbox';
import { AppInput } from '@/components/form/AppInput';
import { AppRadio } from '@/components/form/AppRadio';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import type { YesNoStepData } from '@/types/registration';

interface RequirementEditorProps {
  title: string;
  instruction: string;
  options: readonly string[];
  value: YesNoStepData;
  onChange: (next: YesNoStepData) => void;
}

export function RequirementEditor({
  title,
  instruction,
  options,
  value,
  onChange,
}: RequirementEditorProps) {
  const { colors } = useAppTheme();
  const selectedOptions = value.selectedOptions ?? [];

  const toggleOption = (option: string) => {
    const next = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];
    onChange({ ...value, selectedOptions: next });
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="label" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.instruction}>
        {instruction}
      </AppText>
      <AppRadio
        label="Yes"
        selected={value.hasRequirement === true}
        onSelect={() => onChange({ ...value, hasRequirement: true })}
      />
      <AppRadio
        label="No"
        selected={value.hasRequirement === false}
        onSelect={() => onChange({ ...value, hasRequirement: false, selectedOptions: [], otherDetails: '' })}
      />
      {value.hasRequirement === true ? (
        <View style={styles.options}>
          <AppText variant="label" style={styles.optionsTitle}>
            Please select all that apply:
          </AppText>
          {options.map((option) => (
            <AppCheckbox
              key={option}
              label={option}
              checked={selectedOptions.includes(option)}
              onToggle={() => toggleOption(option)}
            />
          ))}
          {selectedOptions.includes('Other') ? (
            <AppInput
              label="Please specify"
              value={value.otherDetails ?? ''}
              onChangeText={(text) => onChange({ ...value, otherDetails: text })}
              placeholder="Enter details"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginTop: spacing.lg },
  title: { marginBottom: spacing.xs },
  instruction: { marginBottom: spacing.sm },
  options: { gap: spacing.sm, marginTop: spacing.sm },
  optionsTitle: { marginBottom: spacing.xs },
});
