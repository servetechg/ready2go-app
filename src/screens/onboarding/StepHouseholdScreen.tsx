import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';

import { NumericStepper } from '@/components/form/NumericStepper';
import { FormLayout } from '@/components/layout/FormLayout';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentStep, setHouseholdSize } from '@/redux/slices/registrationSlice';
import type { OnboardingStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<
  OnboardingStackParamList,
  typeof ONBOARDING_ROUTES.STEP_HOUSEHOLD
>;

export function StepHouseholdScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const householdSize = useAppSelector((s) => s.registration.householdSize);

  const handleNext = () => {
    dispatch(setHouseholdSize(householdSize));
    dispatch(setCurrentStep(3));
    navigation.navigate(ONBOARDING_ROUTES.STEP_ADA);
  };

  const handleBack = () => {
    dispatch(setCurrentStep(1));
    navigation.navigate(ONBOARDING_ROUTES.STEP_ADDRESS);
  };

  return (
    <FormLayout stepNumber={2} icon="people-outline" onBack={handleBack} onNext={handleNext}>
      <NumericStepper
        value={householdSize}
        onChange={(v) => dispatch(setHouseholdSize(v))}
      />
    </FormLayout>
  );
}
