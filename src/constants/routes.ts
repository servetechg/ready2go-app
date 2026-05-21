export const AUTH_ROUTES = {
  WELCOME: 'Welcome',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  FORGOT_PASSWORD: 'ForgotPassword',
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

export const MAIN_ROUTES = {
  DASHBOARD: 'Dashboard',
} as const;

export const ROOT_ROUTES = {
  AUTH: 'Auth',
  ONBOARDING: 'Onboarding',
  MAIN: 'Main',
} as const;
