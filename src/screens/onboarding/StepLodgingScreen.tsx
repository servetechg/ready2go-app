import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { AppCheckbox } from '@/components/form/AppCheckbox';
import { AppInput } from '@/components/form/AppInput';
import { FormSection } from '@/components/form/FormSection';
import { FormLayout } from '@/components/layout/FormLayout';
import { AppText } from '@/components/ui/AppText';
import { LODGING_OPTIONS } from '@/constants/registration';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUser } from '@/redux/slices/authSlice';
import { completeRegistration, setLodging } from '@/redux/slices/registrationSlice';
import { profileService } from '@/services/profile.service';
import { toProfilePayload } from '@/types/profile';
import type { OnboardingStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/error';
import { lodgingSchema, type LodgingFormData } from '@/validations/registration.schemas';

type Nav = StackNavigationProp<
  OnboardingStackParamList,
  typeof ONBOARDING_ROUTES.STEP_LODGING
>;

export function StepLodgingScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const lodging = useAppSelector((s) => s.registration.lodging);
  const registration = useAppSelector((s) => s.registration);
  const token = useAppSelector((s) => s.auth.token);
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = React.useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<LodgingFormData>({
    resolver: zodResolver(lodgingSchema),
    defaultValues: lodging,
  });

  const selectedOptions = watch('selectedOptions') ?? [];

  const toggleOption = (option: string) => {
    const next = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];
    setValue('selectedOptions', next, { shouldValidate: true });
  };

  const onSubmit = async (data: LodgingFormData) => {
    if (!token) {
      showError('Please sign in to save your profile');
      return;
    }

    setLoading(true);
    const lodgingData = { ...data, otherDetails: data.otherDetails ?? '' };
    dispatch(setLodging(lodgingData));

    try {
      const profile = toProfilePayload({
        ...registration,
        lodging: lodgingData,
      });

      const response = await profileService.completeProfile({ profile }, token);
      dispatch(setUser(response.user));
      dispatch(completeRegistration());
      showSuccess('Registration complete!');
    } catch (error) {
      showError(getErrorMessage(error, 'Could not save profile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      stepNumber={7}
      icon="bed"
      nextLabel="FINISH"
      loading={!!loading}
      onBack={() => navigation.navigate(ONBOARDING_ROUTES.STEP_TRANSPORT)}
      onNext={handleSubmit(onSubmit)}>
      <FormSection title="Please select all that apply:">
        {LODGING_OPTIONS.map((option) => (
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
              />
            )}
          />
        ) : null}
      </FormSection>
    </FormLayout>
  );
}
