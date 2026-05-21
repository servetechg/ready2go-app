import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useRef } from 'react';

import { FormLayout } from '@/components/layout/FormLayout';
import { YesNoStepForm } from '@/components/onboarding/YesNoStepForm';
import { PET_OPTIONS } from '@/constants/registration';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentStep, setPets } from '@/redux/slices/registrationSlice';
import type { OnboardingStackParamList } from '@/types/navigation';
import type { YesNoStepData } from '@/types/registration';
import { petsSchema } from '@/validations/registration.schemas';

type Nav = StackNavigationProp<OnboardingStackParamList, typeof ONBOARDING_ROUTES.STEP_PETS>;

export function StepPetsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const pets = useAppSelector((s) => s.registration.pets);
  const submitRef = useRef<() => void>(() => {});

  const onSubmit = (data: YesNoStepData) => {
    dispatch(setPets(data));
    dispatch(setCurrentStep(6));
    navigation.navigate(ONBOARDING_ROUTES.STEP_TRANSPORT);
  };

  return (
    <FormLayout
      stepNumber={5}
      icon="paw-outline"
      onBack={() => {
        dispatch(setCurrentStep(4));
        navigation.navigate(ONBOARDING_ROUTES.STEP_MEDICAL);
      }}
      onNext={() => submitRef.current()}>
      <YesNoStepForm
        options={PET_OPTIONS}
        defaultValues={pets}
        schema={petsSchema}
        onSubmit={onSubmit}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn;
        }}
      />
    </FormLayout>
  );
}
