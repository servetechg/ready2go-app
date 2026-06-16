import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { DisasterImmediateNeedId } from '@/constants/disasterSurvey';

interface DisasterSurveyState {
  immediateNeeds: DisasterImmediateNeedId[];
  submittedAt: number | null;
  isTestSubmission: boolean;
}

const initialState: DisasterSurveyState = {
  immediateNeeds: [],
  submittedAt: null,
  isTestSubmission: false,
};

const disasterSurveySlice = createSlice({
  name: 'disasterSurvey',
  initialState,
  reducers: {
    submitDisasterImmediateNeeds: (
      state,
      action: PayloadAction<{ needs: DisasterImmediateNeedId[]; isTest?: boolean }>,
    ) => {
      state.immediateNeeds = action.payload.needs;
      state.submittedAt = Date.now();
      state.isTestSubmission = action.payload.isTest ?? false;
    },
    clearDisasterSurvey: () => initialState,
  },
});

export const { submitDisasterImmediateNeeds, clearDisasterSurvey } = disasterSurveySlice.actions;

export default disasterSurveySlice.reducer;
