import { useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCurrentUser } from '@/redux/slices/authSlice';
import { sanitizeRegistration } from '@/redux/slices/registrationSlice';

/** After redux-persist rehydrates, sync session with `GET /users/me`. */
export function useSessionBootstrap() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const lastSyncedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      lastSyncedToken.current = null;
      return;
    }
    if (lastSyncedToken.current === token) return;
    lastSyncedToken.current = token;

    dispatch(sanitizeRegistration());
    void dispatch(fetchCurrentUser());
  }, [dispatch, token]);
}
