import { NavigatorScreenParams } from '@react-navigation/native';

import {
  AUTH_ROUTES,
  DRAWER_ROUTES,
  HOME_STACK_ROUTES,
  MAIN_STACK_ROUTES,
  ONBOARDING_ROUTES,
  PREPAREDNESS_STACK_ROUTES,
  ROOT_ROUTES,
  TAB_ROUTES,
} from '@/constants/routes';

export type AuthStackParamList = {
  [AUTH_ROUTES.WELCOME]: undefined;
  [AUTH_ROUTES.LOGIN]: undefined;
  [AUTH_ROUTES.SIGNUP]: { completeRegistration?: boolean } | undefined;
  [AUTH_ROUTES.OTP_VERIFICATION]: {
    email: string;
    flow: 'signup' | 'resetPassword';
    completeRegistration?: boolean;
  };
  [AUTH_ROUTES.FORGOT_PASSWORD]: undefined;
  [AUTH_ROUTES.UPDATE_PASSWORD]: { email: string };
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

export type HomeStackParamList = {
  [HOME_STACK_ROUTES.HOME]: undefined;
  [HOME_STACK_ROUTES.WEATHER]: undefined;
  [HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS]: undefined;
};

export type PreparednessStackParamList = {
  [PREPAREDNESS_STACK_ROUTES.LIST]: undefined;
  [PREPAREDNESS_STACK_ROUTES.CATEGORY]: { categoryId: string; title: string };
};

export type MainTabParamList = {
  [TAB_ROUTES.HOME]: NavigatorScreenParams<HomeStackParamList>;
  [TAB_ROUTES.ALERTS]: undefined;
  [TAB_ROUTES.PREPAREDNESS]: NavigatorScreenParams<PreparednessStackParamList>;
  [TAB_ROUTES.PROFILE]: undefined;
};

export type MainStackParamList = {
  [MAIN_STACK_ROUTES.TABS]: NavigatorScreenParams<MainTabParamList>;
  [MAIN_STACK_ROUTES.SETTINGS]: undefined;
  [MAIN_STACK_ROUTES.STATIC_INFO]: { title: string; body: string };
};

export type DrawerParamList = {
  [DRAWER_ROUTES.MAIN]: NavigatorScreenParams<MainStackParamList>;
};

export type RootStackParamList = {
  [ROOT_ROUTES.AUTH]: NavigatorScreenParams<AuthStackParamList> & {
    screen?: keyof AuthStackParamList;
  };
  [ROOT_ROUTES.ONBOARDING]: NavigatorScreenParams<OnboardingStackParamList>;
  [ROOT_ROUTES.MAIN]: NavigatorScreenParams<DrawerParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
