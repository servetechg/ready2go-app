import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { CitizenActivityPendingSupplement } from '@/services/citizenActivity.service';

interface CitizenActivityState {
  pendingSupplement: CitizenActivityPendingSupplement | null;
}

const initialState: CitizenActivityState = {
  pendingSupplement: null,
};

const citizenActivitySlice = createSlice({
  name: 'citizenActivity',
  initialState,
  reducers: {
    setCitizenActivityPendingSupplement: (
      state,
      action: PayloadAction<CitizenActivityPendingSupplement | null>,
    ) => {
      state.pendingSupplement = action.payload;
    },
    clearCitizenActivityPendingSupplement: (state) => {
      state.pendingSupplement = null;
    },
  },
});

export const { setCitizenActivityPendingSupplement, clearCitizenActivityPendingSupplement } =
  citizenActivitySlice.actions;

export default citizenActivitySlice.reducer;
