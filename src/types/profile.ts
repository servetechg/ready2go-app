import type { ProfilePayload } from '@/types/api';
import type { RegistrationState } from '@/types/registration';
import { coerceHouseholdSize, pickAddressData } from '@/utils/registration';

/** Maps Redux onboarding state to the API `profile` object (no client-only fields). */
export function toProfilePayload(state: RegistrationState): ProfilePayload {
  return {
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
  };
}
