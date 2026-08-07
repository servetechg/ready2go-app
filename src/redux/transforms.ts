import { createTransform } from 'redux-persist';

import type { RegistrationState } from '@/types/registration';
import { asTokenString } from '@/utils/authSessionStorage';
import { normalizeRegistrationState } from '@/utils/registration';

const emptyAuthPersist = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
};

export const registrationTransform = createTransform(
  (inbound: RegistrationState) => inbound,
  (outbound: RegistrationState) => {
    if (!outbound || typeof outbound !== 'object') {
      return outbound;
    }
    return normalizeRegistrationState(outbound);
  },
);

export const authTransform = createTransform(
  (inbound: {
    isAuthenticated?: unknown;
    user?: unknown;
    token?: unknown;
    refreshToken?: unknown;
  } | null) => {
    if (!inbound || typeof inbound !== 'object') {
      return emptyAuthPersist;
    }
    const token = asTokenString(inbound.token);
    const refreshToken = asTokenString(inbound.refreshToken);
    return {
      ...inbound,
      token,
      refreshToken,
      isAuthenticated: Boolean(token || refreshToken),
    };
  },
  (outbound: {
    isAuthenticated?: unknown;
    user?: unknown;
    token?: unknown;
    refreshToken?: unknown;
  } | null) => {
    // Corrupted / null persist payload used to crash: Cannot read property 'token' of null
    if (!outbound || typeof outbound !== 'object') {
      return emptyAuthPersist;
    }
    const token = asTokenString(outbound.token);
    const refreshToken = asTokenString(outbound.refreshToken);
    return {
      ...outbound,
      token,
      refreshToken,
      isAuthenticated: Boolean(token || refreshToken),
    };
  },
);
