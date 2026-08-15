import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type {
  IdaFinancialImpactId,
  IdaHousingDamageId,
  IdaImmediateNeedId,
  IdaInsuranceTypeId,
  IdaLivingSituationId,
  IdaSafeToLiveId,
} from '@/constants/ida';
import type { IdaInvitation } from '@/services/ida.service';

export type IdaFormDraft = {
  adults: string;
  children: string;
  seniors: string;
  dateOfBirth: string;
  preferredLanguage: string;
  preferredContactMethod: string;
  didEvacuate: boolean | null;
  currentLocation: string;
  homeAccessible: boolean | null;
  housingDamage: IdaHousingDamageId | null;
  safeToLive: IdaSafeToLiveId | null;
  livingSituation: IdaLivingSituationId | null;
  livingSituationOther: string;
  immediateNeeds: IdaImmediateNeedId[];
  immediateNeedsOther: string;
  insuranceTypes: IdaInsuranceTypeId[];
  insuranceCompany: string;
  contactedInsurance: boolean | null;
  financialImpact: IdaFinancialImpactId | null;
};

interface IdaState {
  invitation: IdaInvitation | null;
  draft: IdaFormDraft;
  claimNumber: string | null;
}

const emptyDraft = (): IdaFormDraft => ({
  adults: '',
  children: '',
  seniors: '',
  dateOfBirth: '',
  preferredLanguage: '',
  preferredContactMethod: '',
  didEvacuate: null,
  currentLocation: '',
  homeAccessible: null,
  housingDamage: null,
  safeToLive: null,
  livingSituation: null,
  livingSituationOther: '',
  immediateNeeds: [],
  immediateNeedsOther: '',
  insuranceTypes: [],
  insuranceCompany: '',
  contactedInsurance: null,
  financialImpact: null,
});

const initialState: IdaState = {
  invitation: null,
  draft: emptyDraft(),
  claimNumber: null,
};

const idaSlice = createSlice({
  name: 'ida',
  initialState,
  reducers: {
    setIdaInvitation: (state, action: PayloadAction<IdaInvitation | null>) => {
      state.invitation = action.payload;
      if (action.payload) {
        const household = action.payload.prefill?.household;
        const applicant = action.payload.prefill?.applicant;
        if (household?.adults != null && state.draft.adults === '') {
          state.draft.adults = String(household.adults);
        }
        if (household?.children != null && state.draft.children === '') {
          state.draft.children = String(household.children);
        }
        if (household?.seniors != null && state.draft.seniors === '') {
          state.draft.seniors = String(household.seniors);
        }
        if (applicant?.currentLocation && state.draft.currentLocation === '') {
          state.draft.currentLocation = applicant.currentLocation;
        }
        if (applicant?.dateOfBirth && state.draft.dateOfBirth === '') {
          state.draft.dateOfBirth = applicant.dateOfBirth;
        }
        if (applicant?.preferredLanguage && state.draft.preferredLanguage === '') {
          state.draft.preferredLanguage = applicant.preferredLanguage;
        }
        if (applicant?.preferredContactMethod && state.draft.preferredContactMethod === '') {
          const contact = applicant.preferredContactMethod.trim();
          if (contact === 'Email' || contact === 'Phone' || contact === 'SMS') {
            state.draft.preferredContactMethod = contact;
          }
        }
        if (
          action.payload.status === 'needs_info' &&
          action.payload.existingCurrentLocation &&
          state.draft.currentLocation === ''
        ) {
          state.draft.currentLocation = action.payload.existingCurrentLocation;
        }
        if (
          action.payload.status === 'needs_info' &&
          action.payload.existingInsuranceCompany &&
          state.draft.insuranceCompany === ''
        ) {
          state.draft.insuranceCompany = action.payload.existingInsuranceCompany;
        }
      }
    },
    patchIdaDraft: (state, action: PayloadAction<Partial<IdaFormDraft>>) => {
      state.draft = { ...state.draft, ...action.payload };
    },
    setIdaClaimNumber: (state, action: PayloadAction<string | null>) => {
      state.claimNumber = action.payload;
    },
    clearIda: () => initialState,
  },
});

export const { setIdaInvitation, patchIdaDraft, setIdaClaimNumber, clearIda } = idaSlice.actions;

export default idaSlice.reducer;
