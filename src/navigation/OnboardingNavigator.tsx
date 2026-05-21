import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ONBOARDING_ROUTES } from '@/constants/routes';
import { StepAddressScreen } from '@/screens/onboarding/StepAddressScreen';
import { StepAdaScreen } from '@/screens/onboarding/StepAdaScreen';
import { StepHouseholdScreen } from '@/screens/onboarding/StepHouseholdScreen';
import { StepLodgingScreen } from '@/screens/onboarding/StepLodgingScreen';
import { StepMedicalScreen } from '@/screens/onboarding/StepMedicalScreen';
import { StepPetsScreen } from '@/screens/onboarding/StepPetsScreen';
import { StepTransportScreen } from '@/screens/onboarding/StepTransportScreen';
import type { OnboardingStackParamList } from '@/types/navigation';
import { useAppSelector } from '@/redux/hooks';

import { stackScreenOptions } from './screenOptions';

const Stack = createStackNavigator<OnboardingStackParamList>();

const STEP_ROUTE_MAP: Record<number, keyof OnboardingStackParamList> = {
  1: ONBOARDING_ROUTES.STEP_ADDRESS,
  2: ONBOARDING_ROUTES.STEP_HOUSEHOLD,
  3: ONBOARDING_ROUTES.STEP_ADA,
  4: ONBOARDING_ROUTES.STEP_MEDICAL,
  5: ONBOARDING_ROUTES.STEP_PETS,
  6: ONBOARDING_ROUTES.STEP_TRANSPORT,
  7: ONBOARDING_ROUTES.STEP_LODGING,
};

export function OnboardingNavigator() {
  const currentStep = useAppSelector((s) => s.registration.currentStep);
  const initialRoute = STEP_ROUTE_MAP[currentStep] ?? ONBOARDING_ROUTES.STEP_ADDRESS;

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={stackScreenOptions}>
      <Stack.Screen name={ONBOARDING_ROUTES.STEP_ADDRESS} component={StepAddressScreen} />
      <Stack.Screen name={ONBOARDING_ROUTES.STEP_HOUSEHOLD} component={StepHouseholdScreen} />
      <Stack.Screen name={ONBOARDING_ROUTES.STEP_ADA} component={StepAdaScreen} />
      <Stack.Screen name={ONBOARDING_ROUTES.STEP_MEDICAL} component={StepMedicalScreen} />
      <Stack.Screen name={ONBOARDING_ROUTES.STEP_PETS} component={StepPetsScreen} />
      <Stack.Screen name={ONBOARDING_ROUTES.STEP_TRANSPORT} component={StepTransportScreen} />
      <Stack.Screen name={ONBOARDING_ROUTES.STEP_LODGING} component={StepLodgingScreen} />
    </Stack.Navigator>
  );
}
