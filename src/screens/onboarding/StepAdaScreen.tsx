import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useRef } from 'react';

import { FormLayout } from '@/components/layout/FormLayout';
import { YesNoStepForm } from '@/components/onboarding/YesNoStepForm';
import { ADA_OPTIONS } from '@/constants/registration';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setAda, setCurrentStep } from '@/redux/slices/registrationSlice';
import type { OnboardingStackParamList } from '@/types/navigation';
import type { YesNoStepData } from '@/types/registration';
import { adaSchema } from '@/validations/registration.schemas';

type Nav = StackNavigationProp<OnboardingStackParamList, typeof ONBOARDING_ROUTES.STEP_ADA>;

export function StepAdaScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const ada = useAppSelector((s) => s.registration.ada);
  const submitRef = useRef<() => void>(() => {});

  const onSubmit = (data: YesNoStepData) => {
    dispatch(setAda(data));
    dispatch(setCurrentStep(4));
    navigation.navigate(ONBOARDING_ROUTES.STEP_MEDICAL);
  };

  return (
    <FormLayout
      stepNumber={3}
      icon="accessibility-outline"
      onBack={() => {
        dispatch(setCurrentStep(2));
        navigation.navigate(ONBOARDING_ROUTES.STEP_HOUSEHOLD);
      }}
      onNext={() => submitRef.current()}>
      <YesNoStepForm
        options={ADA_OPTIONS}
        defaultValues={ada}
        schema={adaSchema}
        onSubmit={onSubmit}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn;
        }}
      />
    </FormLayout>
  );
}
