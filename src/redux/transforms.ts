import { createTransform } from 'redux-persist';

import type { RegistrationState } from '@/types/registration';
import { toBoolean } from '@/utils/coerce';
import { normalizeRegistrationState } from '@/utils/registration';

export const registrationTransform = createTransform(
  (inbound: RegistrationState) => inbound,
  (outbound: RegistrationState) => normalizeRegistrationState(outbound),
);

export const authTransform = createTransform(
  (inbound: { isAuthenticated?: unknown; user?: unknown; token?: unknown }) => inbound,
  (outbound: { isAuthenticated?: unknown; user?: unknown; token?: unknown }) => ({
    ...outbound,
    isAuthenticated: toBoolean(outbound.isAuthenticated),
  }),
);
