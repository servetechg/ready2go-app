import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useRef } from 'react';

import { FormLayout } from '@/components/layout/FormLayout';
import { YesNoStepForm } from '@/components/onboarding/YesNoStepForm';
import { TRANSPORT_OPTIONS } from '@/constants/registration';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentStep, setTransport } from '@/redux/slices/registrationSlice';
import type { OnboardingStackParamList } from '@/types/navigation';
import type { YesNoStepData } from '@/types/registration';
import { transportSchema } from '@/validations/registration.schemas';

type Nav = StackNavigationProp<
  OnboardingStackParamList,
  typeof ONBOARDING_ROUTES.STEP_TRANSPORT
>;

export function StepTransportScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const transport = useAppSelector((s) => s.registration.transport);
  const submitRef = useRef<() => void>(() => {});

  const onSubmit = (data: YesNoStepData) => {
    dispatch(setTransport(data));
    dispatch(setCurrentStep(7));
    navigation.navigate(ONBOARDING_ROUTES.STEP_LODGING);
  };

  return (
    <FormLayout
      stepNumber={6}
      icon="car-outline"
      onBack={() => {
        dispatch(setCurrentStep(5));
        navigation.navigate(ONBOARDING_ROUTES.STEP_PETS);
      }}
      onNext={() => submitRef.current()}>
      <YesNoStepForm
        options={TRANSPORT_OPTIONS}
        defaultValues={transport}
        schema={transportSchema}
        onSubmit={onSubmit}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn;
        }}
      />
    </FormLayout>
  );
}
