import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchHome, selectDashboardMode } from '@/redux/slices/dashboardSlice';

const STALE_MS = 5 * 60_000;

/** Loads GET /dashboard/home on focus and supports pull-to-refresh. */
export function useHomeDashboard() {
  const dispatch = useAppDispatch();
  const home = useAppSelector((s) => s.dashboard.home);
  const emergency = useAppSelector((s) => s.dashboard.emergency);
  const loading = useAppSelector((s) => s.dashboard.homeLoading);
  const error = useAppSelector((s) => s.dashboard.homeError);
  const lastFetchedAt = useAppSelector((s) => s.dashboard.lastFetchedAt);
  const mode = useAppSelector(selectDashboardMode);

  useFocusEffect(
    useCallback(() => {
      const isStale = !lastFetchedAt || Date.now() - lastFetchedAt > STALE_MS;
      if (!home || isStale) {
        void dispatch(fetchHome());
      }
    }, [dispatch, home, lastFetchedAt]),
  );

  const reload = useCallback(() => dispatch(fetchHome()).unwrap(), [dispatch]);

  return {
    home,
    emergency,
    loading,
    error,
    mode,
    isCloudy: mode === 'cloudy',
    reload,
  };
}
