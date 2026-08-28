import { US_STATE_NAMES } from '@/constants/usStates';
import type { MobileWeatherAlert, WeatherAlert } from '@/types/dashboard';
import type { MapMarkerPoint } from '@/types/emergency';

/**
 * Extracts a list of allowed state names and abbreviations from the user's addresses.
 */
export function getAllowedStateTokens(address: any, alertLocations: any[]): string[] {
  const allowed = new Set<string>();
  
  const addState = (codeOrName?: string | null) => {
    if (!codeOrName) return;
    const clean = codeOrName.trim().toUpperCase();
    allowed.add(clean);
    
    if (US_STATE_NAMES[clean]) {
      allowed.add(US_STATE_NAMES[clean].toUpperCase());
    } else {
      const entry = Object.entries(US_STATE_NAMES).find(
        (entryItem) => entryItem[1].toUpperCase() === clean
      );
      if (entry) allowed.add(entry[0]);
    }
  };

  addState(address?.state);
  const locs = alertLocations || [];
  for (let i = 0; i < locs.length; i++) {
    addState(locs[i].state);
  }
  
  const result: string[] = [];
  allowed.forEach(val => result.push(val));
  return result;
}

/**
 * Filters a list of alerts to only include those whose location string
 * contains one of the allowed state abbreviations or full names as a whole word.
 */
export function filterAlertsByAllowedStates<T extends MobileWeatherAlert | WeatherAlert>(
  alerts: T[],
  allowedTokens: string[]
): T[] {
  if (!allowedTokens || allowedTokens.length === 0) return alerts;
  
  return alerts.filter(alert => {
    const locStr = (alert.location || '').toUpperCase();
    return allowedTokens.some(token => {
      // Use word boundary to prevent 'AR' from matching 'PARK' or 'MARICOPA'
      const regex = new RegExp(`\\b${token}\\b`);
      return regex.test(locStr);
    });
  });
}

/**
 * Filters a list of map markers to only include those whose title or description
 * contains one of the allowed state abbreviations or full names as a whole word.
 */
export function filterMapMarkersByAllowedStates(
  markers: MapMarkerPoint[],
  allowedTokens: string[]
): MapMarkerPoint[] {
  if (!allowedTokens || allowedTokens.length === 0) return markers;
  
  return markers.filter(marker => {
    const locStr = `${marker.title || ''} ${marker.description || ''}`.toUpperCase();
    return allowedTokens.some(token => {
      const regex = new RegExp(`\\b${token}\\b`);
      return regex.test(locStr);
    });
  });
}
