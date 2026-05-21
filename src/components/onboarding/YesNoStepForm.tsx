import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AppCheckbox } from '@/components/form/AppCheckbox';
import { AppInput } from '@/components/form/AppInput';
import { AppRadio } from '@/components/form/AppRadio';
import { FormSection } from '@/components/form/FormSection';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { YesNoStepData } from '@/types/registration';
import { toBoolean } from '@/utils/coerce';

interface YesNoStepFormProps {
  options: readonly string[];
  defaultValues: YesNoStepData;
  schema: z.ZodTypeAny;
  onSubmit: (data: YesNoStepData) => void;
  onRegisterSubmit: (submit: () => void) => void;
}

export function YesNoStepForm({
  options,
  defaultValues,
  schema,
  onSubmit,
  onRegisterSubmit,
}: YesNoStepFormProps) {
  const { colors } = useAppTheme();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<YesNoStepData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: {
      ...defaultValues,
      hasRequirement:
        defaultValues.hasRequirement === null || defaultValues.hasRequirement === undefined
          ? null
          : toBoolean(defaultValues.hasRequirement),
    },
  });

  const hasRequirement = watch('hasRequirement');
  const selectedOptions = watch('selectedOptions') ?? [];

  const toggleOption = (option: string) => {
    const next = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];
    setValue('selectedOptions', next, { shouldValidate: true });
  };

  useEffect(() => {
    onRegisterSubmit(() => handleSubmit(onSubmit)());
  }, [handleSubmit, onSubmit, onRegisterSubmit]);

  return (
    <>
      <Controller
        control={control}
        name="hasRequirement"
        render={({ field: { onChange, value } }) => (
          <>
            <AppRadio label="Yes" selected={value === true} onSelect={() => onChange(true)} />
            <AppRadio label="No" selected={value === false} onSelect={() => onChange(false)} />
          </>
        )}
      />
      {errors.hasRequirement ? (
        <AppText variant="caption" color={colors.error}>
          {errors.hasRequirement.message}
        </AppText>
      ) : null}

      {hasRequirement === true ? (
        <FormSection title="Please select all that apply:">
          {options.map((option) => (
            <AppCheckbox
              key={option}
              label={option}
              checked={selectedOptions.includes(option)}
              onToggle={() => toggleOption(option)}
            />
          ))}
          {errors.selectedOptions ? (
            <AppText variant="caption" color={colors.error}>
              {errors.selectedOptions.message}
            </AppText>
          ) : null}
          {selectedOptions.includes('Other') ? (
            <Controller
              control={control}
              name="otherDetails"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Please specify"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter details"
                />
              )}
            />
          ) : null}
        </FormSection>
      ) : null}
    </>
  );
}
