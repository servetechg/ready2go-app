import type { ProfileDocumentValue } from '@/types/profileDocument';

export interface AddressData {
  streetAddress: string;
  aptUnit: string;
  city: string;
  state: string;
  zipCode: string;
  useCurrentLocation: boolean;
  /** Optional — sent to backend when supported */
  latitude?: number;
  longitude?: number;
}

/** Optional locations to receive alerts (e.g. family in another state). */
export interface AlertLocation {
  id: string;
  label: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface YesNoStepData {
  hasRequirement: boolean | null;
  selectedOptions: string[];
  otherDetails?: string;
}

export interface RegistrationState {
  currentStep: number;
  isComplete: boolean;
  isStarted: boolean;
  needsAccount: boolean;
  address: AddressData;
  isPrimaryAddress: boolean | null;
  allowResidenceInspection: boolean | null;
  proofOfOwnership: ProfileDocumentValue | null;
  proofOfResidency: ProfileDocumentValue | null;
  householdSize: number;
  ada: YesNoStepData;
  medical: YesNoStepData;
  pets: YesNoStepData;
  transport: YesNoStepData;
  lodging: {
    selectedOptions: string[];
    otherDetails?: string;
  };
  alertLocations: AlertLocation[];
}

export const initialYesNoStep = (): YesNoStepData => ({
  hasRequirement: null,
  selectedOptions: [],
  otherDetails: '',
});

export const initialRegistrationState = (): RegistrationState => ({
  currentStep: 1,
  isComplete: false,
  isStarted: false,
  needsAccount: false,
  address: {
    streetAddress: '',
    aptUnit: '',
    city: '',
    state: '',
    zipCode: '',
    useCurrentLocation: false,
  },
  isPrimaryAddress: null,
  allowResidenceInspection: null,
  proofOfOwnership: null,
  proofOfResidency: null,
  householdSize: 1,
  ada: initialYesNoStep(),
  medical: initialYesNoStep(),
  pets: initialYesNoStep(),
  transport: initialYesNoStep(),
  lodging: {
    selectedOptions: [],
    otherDetails: '',
  },
  alertLocations: [],
});
