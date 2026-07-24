import { useCallback } from 'react';

import { useAppDispatch } from '@/redux/hooks';
import { markAlertReadRemote } from '@/redux/slices/alertsSlice';
import type { WeatherAlert } from '@/types/dashboard';
import { openAlertSourceUrl } from '@/utils/openAlertSource';

export function useAlertSourcePress() {
  const dispatch = useAppDispatch();

  return useCallback(
    (alert: WeatherAlert) => {
      if (!alert.read) {
        void dispatch(markAlertReadRemote(alert.id));
      }
      if (alert.sourceUrl) {
        void openAlertSourceUrl(alert.sourceUrl);
      }
    },
    [dispatch],
  );
}
