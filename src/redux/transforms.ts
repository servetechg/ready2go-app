import { createTransform } from 'redux-persist';

import type { RegistrationState } from '@/types/registration';
import { toBoolean } from '@/utils/coerce';

function normalizeRegistration(state: RegistrationState): RegistrationState {
  return {
    ...state,
    isStarted: toBoolean(state.isStarted),
    isComplete: toBoolean(state.isComplete),
    needsAccount: toBoolean(state.needsAccount),
    address: {
      ...state.address,
      useCurrentLocation: toBoolean(state.address?.useCurrentLocation),
    },
    ada: {
      ...state.ada,
      hasRequirement:
        state.ada?.hasRequirement === null || state.ada?.hasRequirement === undefined
          ? null
          : toBoolean(state.ada.hasRequirement),
    },
    medical: {
      ...state.medical,
      hasRequirement:
        state.medical?.hasRequirement === null || state.medical?.hasRequirement === undefined
          ? null
          : toBoolean(state.medical.hasRequirement),
    },
    pets: {
      ...state.pets,
      hasRequirement:
        state.pets?.hasRequirement === null || state.pets?.hasRequirement === undefined
          ? null
          : toBoolean(state.pets.hasRequirement),
    },
    transport: {
      ...state.transport,
      hasRequirement:
        state.transport?.hasRequirement === null ||
        state.transport?.hasRequirement === undefined
          ? null
          : toBoolean(state.transport.hasRequirement),
    },
  };
}

export const registrationTransform = createTransform(
  (inbound: RegistrationState) => inbound,
  (outbound: RegistrationState) => normalizeRegistration(outbound),
);

export const authTransform = createTransform(
  (inbound: { isAuthenticated?: unknown; user?: unknown; token?: unknown }) => inbound,
  (outbound: { isAuthenticated?: unknown; user?: unknown; token?: unknown }) => ({
    ...outbound,
    isAuthenticated: toBoolean(outbound.isAuthenticated),
  }),
);
