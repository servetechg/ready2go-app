import { useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCurrentUser } from '@/redux/slices/authSlice';
import {
  completeRegistration,
  hydrateProfileFromApi,
  sanitizeRegistration,
} from '@/redux/slices/registrationSlice';
import { toBoolean } from '@/utils/coerce';
import { normalizeProfilePayload } from '@/utils/registration';

/** After redux-persist rehydrates, sync session with `GET /users/me`. */
export function useSessionBootstrap() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;

    void (async () => {
      dispatch(sanitizeRegistration());
      const result = await dispatch(fetchCurrentUser());
      if (!fetchCurrentUser.fulfilled.match(result)) return;

      const { user, profile } = result.payload;
      const normalizedProfile = normalizeProfilePayload(profile);
      if (normalizedProfile) {
        dispatch(hydrateProfileFromApi(normalizedProfile));
      }
      if (toBoolean(user.profileComplete)) {
        dispatch(completeRegistration());
      }
    })();
  }, [dispatch, token]);
}
