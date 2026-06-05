import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCurrentUser } from '@/redux/slices/authSlice';

/** Refreshes user + profile from `GET /users/me` when a screen gains focus. */
export function useRefreshProfileOnFocus(enabled = true) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const profileComplete = useAppSelector((s) => s.auth.user?.profileComplete);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !token || !profileComplete) return;
      void dispatch(fetchCurrentUser());
    }, [dispatch, enabled, profileComplete, token]),
  );
}
