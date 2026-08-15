import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCategories } from '@/redux/slices/preparednessSlice';
import { toBoolean } from '@/utils/coerce';

const STALE_MS = 5 * 60_000;

/** Loads jurisdiction-scoped categories when a screen gains focus. */
export function usePreparednessCategories(enabled = true) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const profileComplete = toBoolean(useAppSelector((s) => s.auth.user?.profileComplete));
  const lastFetchedAt = useAppSelector((s) => s.preparedness.lastFetchedAt);
  const loading = useAppSelector((s) => s.preparedness.loading);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !token || !profileComplete) return;
      const stale = !lastFetchedAt || Date.now() - lastFetchedAt > STALE_MS;
      if (stale && !loading) {
        void dispatch(fetchCategories(undefined));
      }
    }, [dispatch, enabled, profileComplete, token, lastFetchedAt, loading]),
  );
}
