import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { fetchCurrentUser } from '@/redux/slices/authSlice';
import type { ProfilePayload } from '@/types/api';
import type { AddressData, AlertLocation, RegistrationState, YesNoStepData } from '@/types/registration';
import type { ProfileDocumentValue } from '@/types/profileDocument';
import { initialRegistrationState } from '@/types/registration';
import { toBoolean } from '@/utils/coerce';
import {
  coerceHouseholdSize,
  normalizeProfilePayload,
  normalizeRegistrationState,
  pickAddressData,
  pickAlertLocations,
} from '@/utils/registration';

function applyProfilePayload(state: RegistrationState, profile: ProfilePayload) {
  const p = normalizeProfilePayload(profile) ?? profile;
  state.address = pickAddressData(p.address);
  state.householdSize = coerceHouseholdSize(p.householdSize);
  state.ada = p.ada;
  state.medical = p.medical;
  state.pets = p.pets;
  state.transport = p.transport;
  state.lodging = {
    selectedOptions: p.lodging.selectedOptions,
    otherDetails: p.lodging.otherDetails ?? '',
  };
  if (p.isPrimaryAddress !== undefined) {
    state.isPrimaryAddress = p.isPrimaryAddress;
  }
  if (p.allowResidenceInspection !== undefined) {
    state.allowResidenceInspection = p.allowResidenceInspection;
  }
  if (p.proofOfOwnership) {
    state.proofOfOwnership = p.proofOfOwnership;
  }
  if (p.proofOfResidency) {
    state.proofOfResidency = p.proofOfResidency;
  }
  if (p.alertLocations) {
    state.alertLocations = pickAlertLocations(p.alertLocations);
  }
  state.currentStep = 8;
}

function markRegistrationComplete(state: RegistrationState) {
  state.isComplete = true;
  state.isStarted = false;
  state.needsAccount = false;
  state.currentStep = 8;
}

const registrationSlice = createSlice({
  name: 'registration',
  initialState: initialRegistrationState(),
  reducers: {
    startRegistration: () => {
      const state = initialRegistrationState();
      state.isStarted = true;
      return state;
    },
    cancelRegistration: () => initialRegistrationState(),
    setNeedsAccount: (state, action: PayloadAction<boolean>) => {
      state.needsAccount = action.payload;
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setAddress: (state, action: PayloadAction<AddressData>) => {
      state.address = pickAddressData(action.payload);
    },
    setAddressVerification: (
      state,
      action: PayloadAction<{
        isPrimaryAddress?: boolean | null;
        allowResidenceInspection?: boolean | null;
      }>,
    ) => {
      if (action.payload.isPrimaryAddress !== undefined) {
        state.isPrimaryAddress = action.payload.isPrimaryAddress;
      }
      if (action.payload.allowResidenceInspection !== undefined) {
        state.allowResidenceInspection = action.payload.allowResidenceInspection;
      }
    },
    setProofOfOwnership: (state, action: PayloadAction<ProfileDocumentValue | null>) => {
      state.proofOfOwnership = action.payload;
    },
    setProofOfResidency: (state, action: PayloadAction<ProfileDocumentValue | null>) => {
      state.proofOfResidency = action.payload;
    },
    setHouseholdSize: (state, action: PayloadAction<number>) => {
      state.householdSize = coerceHouseholdSize(action.payload);
    },
    setAda: (state, action: PayloadAction<YesNoStepData>) => {
      state.ada = action.payload;
    },
    setMedical: (state, action: PayloadAction<YesNoStepData>) => {
      state.medical = action.payload;
    },
    setPets: (state, action: PayloadAction<YesNoStepData>) => {
      state.pets = action.payload;
    },
    setTransport: (state, action: PayloadAction<YesNoStepData>) => {
      state.transport = action.payload;
    },
    setLodging: (
      state,
      action: PayloadAction<{ selectedOptions: string[]; otherDetails?: string }>,
    ) => {
      state.lodging = action.payload;
    },
    setAlertLocations: (state, action: PayloadAction<AlertLocation[]>) => {
      state.alertLocations = pickAlertLocations(action.payload);
    },
    completeRegistration: (state) => {
      state.isComplete = true;
      state.isStarted = false;
      state.needsAccount = false;
      state.currentStep = 8;
    },
    resetRegistration: () => initialRegistrationState(),
    hydrateProfileFromApi: (state, action: PayloadAction<ProfilePayload>) => {
      applyProfilePayload(state, action.payload);
    },
    sanitizeRegistration: (state) => {
      return normalizeRegistrationState(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      const { user, profile } = action.payload;
      const normalized = normalizeProfilePayload(profile);
      if (normalized) {
        applyProfilePayload(state, normalized);
      }
      if (toBoolean(user.profileComplete)) {
        markRegistrationComplete(state);
      }
    });
  },
});

export const {
  startRegistration,
  cancelRegistration,
  setNeedsAccount,
  setCurrentStep,
  setAddress,
  setAddressVerification,
  setProofOfOwnership,
  setProofOfResidency,
  setHouseholdSize,
  setAda,
  setMedical,
  setPets,
  setTransport,
  setLodging,
  setAlertLocations,
  completeRegistration,
  resetRegistration,
  hydrateProfileFromApi,
  sanitizeRegistration,
} = registrationSlice.actions;

export default registrationSlice.reducer;
