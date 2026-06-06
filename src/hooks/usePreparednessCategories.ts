import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCategories } from '@/redux/slices/preparednessSlice';
import { toBoolean } from '@/utils/coerce';

/** Loads jurisdiction-scoped categories when a screen gains focus. */
export function usePreparednessCategories(enabled = true) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const profileComplete = toBoolean(useAppSelector((s) => s.auth.user?.profileComplete));

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !token || !profileComplete) return;
      void dispatch(fetchCategories(undefined));
    }, [dispatch, enabled, profileComplete, token]),
  );
}
