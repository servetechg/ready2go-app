import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useRef } from 'react';

import { FormLayout } from '@/components/layout/FormLayout';
import { YesNoStepForm } from '@/components/onboarding/YesNoStepForm';
import { MEDICAL_OPTIONS } from '@/constants/registration';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentStep, setMedical } from '@/redux/slices/registrationSlice';
import type { OnboardingStackParamList } from '@/types/navigation';
import type { YesNoStepData } from '@/types/registration';
import { medicalSchema } from '@/validations/registration.schemas';

type Nav = StackNavigationProp<
  OnboardingStackParamList,
  typeof ONBOARDING_ROUTES.STEP_MEDICAL
>;

export function StepMedicalScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const medical = useAppSelector((s) => s.registration.medical);
  const submitRef = useRef<() => void>(() => {});

  const onSubmit = (data: YesNoStepData) => {
    dispatch(setMedical(data));
    dispatch(setCurrentStep(5));
    navigation.navigate(ONBOARDING_ROUTES.STEP_PETS);
  };

  return (
    <FormLayout
      stepNumber={4}
      icon="heart-outline"
      onBack={() => {
        dispatch(setCurrentStep(3));
        navigation.navigate(ONBOARDING_ROUTES.STEP_ADA);
      }}
      onNext={() => submitRef.current()}>
      <YesNoStepForm
        options={MEDICAL_OPTIONS}
        defaultValues={medical}
        schema={medicalSchema}
        onSubmit={onSubmit}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn;
        }}
      />
    </FormLayout>
  );
}
