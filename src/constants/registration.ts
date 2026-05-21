import { ONBOARDING_ROUTES } from './routes';

export const REGISTRATION_STEPS = [
  {
    id: 1,
    route: ONBOARDING_ROUTES.STEP_ADDRESS,
    title: 'Address / Location Information',
    instruction: 'Please enter where you live.',
    icon: 'location',
  },
  {
    id: 2,
    route: ONBOARDING_ROUTES.STEP_HOUSEHOLD,
    title: 'Household Size',
    instruction: 'How many people live in your household?',
    icon: 'people',
  },
  {
    id: 3,
    route: ONBOARDING_ROUTES.STEP_ADA,
    title: 'ADA Requirements',
    instruction: 'Do you or anyone in your household have ADA requirements?',
    icon: 'accessibility' as const,
  },
  {
    id: 4,
    route: ONBOARDING_ROUTES.STEP_MEDICAL,
    title: 'Medical Needs',
    instruction: 'Do you or anyone in your household have medical needs?',
    icon: 'heart' as const,
  },
  {
    id: 5,
    route: ONBOARDING_ROUTES.STEP_PETS,
    title: 'Pet / Livestock Information',
    instruction: 'Do you have pets or livestock?',
    icon: 'paw' as const,
  },
  {
    id: 6,
    route: ONBOARDING_ROUTES.STEP_TRANSPORT,
    title: 'Transportation Limitations',
    instruction: 'Do you or anyone in your household have transportation limitations?',
    icon: 'car' as const,
  },
  {
    id: 7,
    route: ONBOARDING_ROUTES.STEP_LODGING,
    title: 'Lodging Preferences',
    instruction: 'Do you have any lodging preferences in the event you need shelter?',
    icon: 'bed' as const,
  },
] as const;

export const TOTAL_REGISTRATION_STEPS = REGISTRATION_STEPS.length;

export const ADA_OPTIONS = [
  'Mobility (Wheelchair, Walker)',
  'Hearing Impairment',
  'Vision Impairment',
  'Other',
] as const;

export const MEDICAL_OPTIONS = [
  'Diabetes',
  'Respiratory Condition',
  'Heart Condition',
  'Dialysis',
  'Medication Dependent',
  'Other',
] as const;

export const PET_OPTIONS = [
  'Dog(s)',
  'Cat(s)',
  'Bird(s)',
  'Livestock',
  'Other',
] as const;

export const TRANSPORT_OPTIONS = [
  'No Vehicle',
  'Limited Mobility',
  'Need Accessible Vehicle',
  'Other',
] as const;

export const LODGING_OPTIONS = [
  'Accessible Room (ADA)',
  'Pet Friendly',
  'Ground Floor',
  'Two Beds',
  'Other',
] as const;

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;
