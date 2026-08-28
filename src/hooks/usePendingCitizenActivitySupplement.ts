import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCitizenActivityPendingSupplement } from '@/redux/slices/citizenActivitySlice';
import { citizenActivityService } from '@/services/citizenActivity.service';

export function usePendingCitizenActivitySupplement(token: string | null) {
  const dispatch = useAppDispatch();
  const pending = useAppSelector((s) => s.citizenActivity.pendingSupplement);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      dispatch(setCitizenActivityPendingSupplement(null));
      return;
    }
    setLoading(true);
    try {
      const { pending: next } = await citizenActivityService.getPendingSupplement(token);
      dispatch(setCitizenActivityPendingSupplement(next));
    } catch {
      dispatch(setCitizenActivityPendingSupplement(null));
    } finally {
      setLoading(false);
    }
  }, [dispatch, token]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const hasPendingSupplement =
    pending != null && pending.requestedMissingFields.length > 0;

  return {
    pending,
    hasPendingSupplement,
    loading,
    refresh,
  };
}
