import type { ProfilePayload } from '@/types/api';
import type { RegistrationState } from '@/types/registration';
import { coerceHouseholdSize, pickAddressData } from '@/utils/registration';

/** Maps Redux onboarding state to the API `profile` object (no client-only fields). */
export function toProfilePayload(state: RegistrationState): ProfilePayload {
  const payload: ProfilePayload = {
    address: pickAddressData(state.address),
    householdSize: coerceHouseholdSize(state.householdSize),
    ada: state.ada,
    medical: state.medical,
    pets: state.pets,
    transport: state.transport,
    lodging: {
      selectedOptions: state.lodging.selectedOptions,
      otherDetails: state.lodging.otherDetails ?? '',
    },
    ...(state.isPrimaryAddress !== null ? { isPrimaryAddress: state.isPrimaryAddress } : {}),
    ...(state.allowResidenceInspection !== null
      ? { allowResidenceInspection: state.allowResidenceInspection }
      : {}),
    ...(state.alertLocations.length > 0 ? { alertLocations: state.alertLocations } : {}),
  };

  if (state.proofOfOwnership && !('uri' in state.proofOfOwnership)) {
    payload.proofOfOwnership = state.proofOfOwnership;
  }
  if (state.proofOfResidency && !('uri' in state.proofOfResidency)) {
    payload.proofOfResidency = state.proofOfResidency;
  }

  return payload;
}
