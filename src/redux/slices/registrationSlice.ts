import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { fetchCurrentUser } from '@/redux/slices/authSlice';
import type { ProfilePayload } from '@/types/api';
import type { AddressData, RegistrationState, YesNoStepData } from '@/types/registration';
import { initialRegistrationState } from '@/types/registration';
import { toBoolean } from '@/utils/coerce';
import {
  coerceHouseholdSize,
  normalizeProfilePayload,
  normalizeRegistrationState,
  pickAddressData,
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
  state.currentStep = 7;
}

function markRegistrationComplete(state: RegistrationState) {
  state.isComplete = true;
  state.isStarted = false;
  state.needsAccount = false;
  state.currentStep = 7;
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
    completeRegistration: (state) => {
      state.isComplete = true;
      state.isStarted = false;
      state.needsAccount = false;
      state.currentStep = 7;
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
  setHouseholdSize,
  setAda,
  setMedical,
  setPets,
  setTransport,
  setLodging,
  completeRegistration,
  resetRegistration,
  hydrateProfileFromApi,
  sanitizeRegistration,
} = registrationSlice.actions;

export default registrationSlice.reducer;
