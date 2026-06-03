import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';

import { NumericStepper } from '@/components/form/NumericStepper';
import { FormLayout } from '@/components/layout/FormLayout';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentStep, setHouseholdSize } from '@/redux/slices/registrationSlice';
import type { OnboardingStackParamList } from '@/types/navigation';
import { coerceHouseholdSize } from '@/utils/registration';

type Nav = StackNavigationProp<
  OnboardingStackParamList,
  typeof ONBOARDING_ROUTES.STEP_HOUSEHOLD
>;

export function StepHouseholdScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const householdSizeRaw = useAppSelector((s) => s.registration.householdSize);
  const householdSize = coerceHouseholdSize(householdSizeRaw);

  const handleNext = () => {
    dispatch(setHouseholdSize(householdSize));
    dispatch(setCurrentStep(4));
    navigation.navigate(ONBOARDING_ROUTES.STEP_ADA);
  };

  const handleBack = () => {
    dispatch(setCurrentStep(2));
    navigation.navigate(ONBOARDING_ROUTES.STEP_ALERT_LOCATIONS);
  };

  return (
    <FormLayout stepNumber={3} icon="people" onBack={handleBack} onNext={handleNext}>
      <NumericStepper
        value={householdSize}
        onChange={(v) => dispatch(setHouseholdSize(v))}
      />
    </FormLayout>
  );
}
