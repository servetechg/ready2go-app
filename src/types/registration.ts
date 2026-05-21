export interface AddressData {
  streetAddress: string;
  aptUnit: string;
  city: string;
  state: string;
  zipCode: string;
  useCurrentLocation: boolean;
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
  householdSize: number;
  ada: YesNoStepData;
  medical: YesNoStepData;
  pets: YesNoStepData;
  transport: YesNoStepData;
  lodging: {
    selectedOptions: string[];
    otherDetails?: string;
  };
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
  householdSize: 1,
  ada: initialYesNoStep(),
  medical: initialYesNoStep(),
  pets: initialYesNoStep(),
  transport: initialYesNoStep(),
  lodging: {
    selectedOptions: [],
    otherDetails: '',
  },
});
