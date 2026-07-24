import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchHome, selectDashboardMode } from '@/redux/slices/dashboardSlice';

/** Loads home dashboard data (map, incidents, news preview). */
export function useEmergencyDashboard() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectDashboardMode);
  const emergency = useAppSelector((s) => s.dashboard.emergency);
  const loading = useAppSelector((s) => s.dashboard.homeLoading);
  const error = useAppSelector((s) => s.dashboard.homeError);

  const reload = useCallback(() => dispatch(fetchHome()).unwrap(), [dispatch]);

  return { mode, emergency, loading, error, isCloudy: mode === 'cloudy', reload };
}
