import type { ProfilePayload } from '@/types/api';
import type { AlertLocation, RegistrationState, YesNoStepData } from '@/types/registration';
import { toAlertLocationsForComplete } from '@/utils/profileApi';
import { coerceHouseholdSize, pickAddressData } from '@/utils/registration';

function toRequirementSection(step: YesNoStepData) {
  const hasRequirement = step.hasRequirement === true;
  return {
    hasRequirement,
    selectedOptions: hasRequirement ? step.selectedOptions : [],
    otherDetails: step.otherDetails ?? '',
  };
}

/** Maps Redux onboarding state to the API `profile` object (no client-only fields). */
export function toProfilePayload(state: RegistrationState): ProfilePayload {
  const payload: ProfilePayload = {
    address: pickAddressData(state.address),
    householdSize: coerceHouseholdSize(state.householdSize),
    ada: toRequirementSection(state.ada),
    medical: toRequirementSection(state.medical),
    pets: toRequirementSection(state.pets),
    transport: toRequirementSection(state.transport),
    lodging: {
      selectedOptions: state.lodging.selectedOptions,
      otherDetails: state.lodging.otherDetails ?? '',
    },
    alertLocations: toAlertLocationsForComplete(state.alertLocations),
  };

  if (state.isPrimaryAddress !== null) {
    payload.isPrimaryAddress = state.isPrimaryAddress;
  }
  if (state.allowResidenceInspection !== null) {
    payload.allowResidenceInspection = state.allowResidenceInspection;
  }
  if (state.proofOfOwnership && !('uri' in state.proofOfOwnership)) {
    payload.proofOfOwnership = state.proofOfOwnership;
  }
  if (state.proofOfResidency && !('uri' in state.proofOfResidency)) {
    payload.proofOfResidency = state.proofOfResidency;
  }

  return payload;
}
