import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loadEmergencyDashboard, selectDashboardMode } from '@/redux/slices/dashboardSlice';

/** Loads mock/API emergency dashboard data when mode changes. */
export function useEmergencyDashboard() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectDashboardMode);
  const emergency = useAppSelector((s) => s.dashboard.emergency);
  const loading = useAppSelector((s) => s.dashboard.emergencyLoading);
  const error = useAppSelector((s) => s.dashboard.emergencyError);

  useEffect(() => {
    void dispatch(loadEmergencyDashboard(mode));
  }, [dispatch, mode]);

  return { mode, emergency, loading, error, isCloudy: mode === 'cloudy' };
}
