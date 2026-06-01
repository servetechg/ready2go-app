export const AUTH_ROUTES = {
  WELCOME: 'Welcome',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  OTP_VERIFICATION: 'OtpVerification',
  FORGOT_PASSWORD: 'ForgotPassword',
  UPDATE_PASSWORD: 'UpdatePassword',
} as const;

export const ONBOARDING_ROUTES = {
  STEP_ADDRESS: 'StepAddress',
  STEP_HOUSEHOLD: 'StepHousehold',
  STEP_ADA: 'StepAda',
  STEP_MEDICAL: 'StepMedical',
  STEP_PETS: 'StepPets',
  STEP_TRANSPORT: 'StepTransport',
  STEP_LODGING: 'StepLodging',
} as const;

export const TAB_ROUTES = {
  HOME: 'HomeTab',
  ALERTS: 'AlertsTab',
  PREPAREDNESS: 'PreparednessTab',
  PROFILE: 'ProfileTab',
} as const;

export const HOME_STACK_ROUTES = {
  HOME: 'Home',
  WEATHER: 'Weather',
  WEATHER_ALERT_SETTINGS: 'WeatherAlertSettings',
} as const;

export const PREPAREDNESS_STACK_ROUTES = {
  LIST: 'PreparednessList',
  CATEGORY: 'PreparednessCategory',
} as const;

export const MAIN_STACK_ROUTES = {
  TABS: 'MainTabs',
  SETTINGS: 'Settings',
  STATIC_INFO: 'StaticInfo',
} as const;

export const DRAWER_ROUTES = {
  MAIN: 'DrawerMain',
} as const;

/** @deprecated Use TAB_ROUTES / HOME_STACK_ROUTES */
export const MAIN_ROUTES = {
  DASHBOARD: 'Dashboard',
} as const;

export const ROOT_ROUTES = {
  AUTH: 'Auth',
  ONBOARDING: 'Onboarding',
  MAIN: 'Main',
} as const;
