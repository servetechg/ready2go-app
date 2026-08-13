import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAlerts } from '@/redux/slices/alertsSlice';
import { fetchHome, selectDashboardMode } from '@/redux/slices/dashboardSlice';
import { fetchCategories } from '@/redux/slices/preparednessSlice';
import { asTokenString } from '@/utils/authSessionStorage';
import { toBoolean } from '@/utils/coerce';

const STALE_MS = 5 * 60_000;
const HOME_PREVIEW_LIMIT = 2;

/** Loads home + alert/preparedness previews (2 each) on focus. */
export function useHomeDashboard() {
  const dispatch = useAppDispatch();
  const home = useAppSelector((s) => s.dashboard.home);
  const emergency = useAppSelector((s) => s.dashboard.emergency);
  const loading = useAppSelector((s) => s.dashboard.homeLoading);
  const error = useAppSelector((s) => s.dashboard.homeError);
  const lastFetchedAt = useAppSelector((s) => s.dashboard.lastFetchedAt);
  const mode = useAppSelector(selectDashboardMode);
  const sessionReady = useAppSelector((s) => s.auth.sessionReady);
  const token = useAppSelector((s) => asTokenString(s.auth.token));
  const profileComplete = toBoolean(useAppSelector((s) => s.auth.user?.profileComplete));
  const alertItems = useAppSelector((s) => s.alerts.items ?? []);
  const alertsLastFetchedAt = useAppSelector((s) => s.alerts.lastFetchedAt);
  const prepLastFetchedAt = useAppSelector((s) => s.preparedness.lastFetchedAt);
  const preparednessLoading = useAppSelector((s) => s.preparedness.loading);

  useFocusEffect(
    useCallback(() => {
      if (!sessionReady || !token) return;

      const homeStale = !lastFetchedAt || Date.now() - lastFetchedAt > STALE_MS;
      if (!home || homeStale) {
        void dispatch(fetchHome());
      }

      // Always refresh a small alerts preview so Home can show 2 cards when they exist.
      const alertsStale =
        !alertsLastFetchedAt || Date.now() - alertsLastFetchedAt > STALE_MS;
      if (alertItems.length === 0 || alertsStale) {
        void dispatch(fetchAlerts());
      }

      const prepStale = !prepLastFetchedAt || Date.now() - prepLastFetchedAt > STALE_MS;
      if (profileComplete && prepStale && !preparednessLoading) {
        void dispatch(fetchCategories(undefined));
      }
    }, [
      dispatch,
      home,
      lastFetchedAt,
      sessionReady,
      token,
      alertItems.length,
      alertsLastFetchedAt,
      profileComplete,
      prepLastFetchedAt,
      preparednessLoading,
    ]),
  );

  const reload = useCallback(async () => {
    await dispatch(fetchHome()).unwrap();
    void dispatch(fetchAlerts());
    if (profileComplete) {
      void dispatch(fetchCategories(undefined));
    }
  }, [dispatch, profileComplete]);

  return {
    home,
    emergency,
    loading: loading || !sessionReady,
    error,
    mode,
    isCloudy: mode === 'cloudy',
    previewLimit: HOME_PREVIEW_LIMIT,
    reload,
  };
}
