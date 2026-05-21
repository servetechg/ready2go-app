import { NavigatorScreenParams } from '@react-navigation/native';

import { AUTH_ROUTES, MAIN_ROUTES, ONBOARDING_ROUTES, ROOT_ROUTES } from '@/constants/routes';

export type AuthStackParamList = {
  [AUTH_ROUTES.WELCOME]: undefined;
  [AUTH_ROUTES.LOGIN]: undefined;
  [AUTH_ROUTES.SIGNUP]: { completeRegistration?: boolean } | undefined;
  [AUTH_ROUTES.FORGOT_PASSWORD]: undefined;
};

export type OnboardingStackParamList = {
  [ONBOARDING_ROUTES.STEP_ADDRESS]: undefined;
  [ONBOARDING_ROUTES.STEP_HOUSEHOLD]: undefined;
  [ONBOARDING_ROUTES.STEP_ADA]: undefined;
  [ONBOARDING_ROUTES.STEP_MEDICAL]: undefined;
  [ONBOARDING_ROUTES.STEP_PETS]: undefined;
  [ONBOARDING_ROUTES.STEP_TRANSPORT]: undefined;
  [ONBOARDING_ROUTES.STEP_LODGING]: undefined;
};

export type MainStackParamList = {
  [MAIN_ROUTES.DASHBOARD]: undefined;
};

export type RootStackParamList = {
  [ROOT_ROUTES.AUTH]: NavigatorScreenParams<AuthStackParamList> & {
    screen?: keyof AuthStackParamList;
  };
  [ROOT_ROUTES.ONBOARDING]: NavigatorScreenParams<OnboardingStackParamList>;
  [ROOT_ROUTES.MAIN]: NavigatorScreenParams<MainStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
