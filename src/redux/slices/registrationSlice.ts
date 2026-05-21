import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { AddressData, RegistrationState, YesNoStepData } from '@/types/registration';
import { initialRegistrationState } from '@/types/registration';
import { toBoolean } from '@/utils/coerce';

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
      state.address = {
        ...action.payload,
        useCurrentLocation: toBoolean(action.payload.useCurrentLocation),
      };
    },
    setHouseholdSize: (state, action: PayloadAction<number>) => {
      state.householdSize = action.payload;
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
} = registrationSlice.actions;

export default registrationSlice.reducer;
