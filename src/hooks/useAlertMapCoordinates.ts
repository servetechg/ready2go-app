import { useEffect, useMemo, useRef, useState } from 'react';

import type { WeatherAlert } from '@/types/dashboard';
import { extractAlertCoordinates, type AlertCoordinates } from '@/utils/alertCoordinates';
import { geocodeAlertLocation } from '@/utils/alertGeocoding';

/** Resolves map coordinates per alert: API geometry first, then geocoded location text. */
export function useAlertMapCoordinates(alerts: WeatherAlert[]) {
  const [geocoded, setGeocoded] = useState<Record<string, AlertCoordinates>>({});
  const pendingRef = useRef(new Set<string>());
  const resolvedRef = useRef(new Set<string>());

  useEffect(() => {
    for (const alert of alerts) {
      if (extractAlertCoordinates(alert)) continue;
      if (resolvedRef.current.has(alert.id) || pendingRef.current.has(alert.id)) continue;

      pendingRef.current.add(alert.id);
      void geocodeAlertLocation(alert.location).then((coords) => {
        pendingRef.current.delete(alert.id);
        resolvedRef.current.add(alert.id);
        if (!coords) return;
        setGeocoded((prev) =>
          prev[alert.id] ? prev : { ...prev, [alert.id]: coords },
        );
      });
    }
  }, [alerts]);

  return useMemo(() => {
    const byId = new Map<string, AlertCoordinates>();
    for (const alert of alerts) {
      const fromApi = extractAlertCoordinates(alert);
      if (fromApi) {
        byId.set(alert.id, fromApi);
        continue;
      }
      const fromGeocode = geocoded[alert.id];
      if (fromGeocode) {
        byId.set(alert.id, fromGeocode);
      }
    }
    return byId;
  }, [alerts, geocoded]);
}
