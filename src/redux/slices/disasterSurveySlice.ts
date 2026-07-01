import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { DisasterImmediateNeedId } from '@/constants/disasterSurvey';
import type { DisasterSurveyInvitation } from '@/services/disasterSurvey.service';

interface DisasterSurveyState {
  invitation: DisasterSurveyInvitation | null;
  immediateNeeds: DisasterImmediateNeedId[];
  submittedAt: string | null;
}

const initialState: DisasterSurveyState = {
  invitation: null,
  immediateNeeds: [],
  submittedAt: null,
};

const disasterSurveySlice = createSlice({
  name: 'disasterSurvey',
  initialState,
  reducers: {
    setDisasterSurveyInvitation: (
      state,
      action: PayloadAction<DisasterSurveyInvitation | null>,
    ) => {
      state.invitation = action.payload;
    },
    setDisasterImmediateNeeds: (state, action: PayloadAction<DisasterImmediateNeedId[]>) => {
      state.immediateNeeds = action.payload;
    },
    markDisasterSubmitted: (state, action: PayloadAction<string>) => {
      state.submittedAt = action.payload;
      if (state.invitation) {
        state.invitation = { ...state.invitation, status: 'submitted' };
      }
    },
    clearDisasterSurvey: () => initialState,
  },
});

export const {
  setDisasterSurveyInvitation,
  setDisasterImmediateNeeds,
  markDisasterSubmitted,
  clearDisasterSurvey,
} = disasterSurveySlice.actions;

export default disasterSurveySlice.reducer;
