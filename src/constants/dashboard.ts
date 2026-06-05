import type { WeatherAlert, WeatherAlertPreference, WeatherSnapshot } from '@/types/dashboard';

export const MOCK_WEATHER: WeatherSnapshot = {
  temperatureF: 72,
  condition: 'Partly Cloudy',
  highF: 78,
  lowF: 58,
  humidity: 45,
  windMph: 8,
  locationLabel: 'Your area',
};

export const MOCK_ALERTS: WeatherAlert[] = [
  {
    id: '1',
    severity: 'MODERATE',
    title: 'Flood Watch',
    location: 'CHEYENNE RIVER ABOVE ANGOSTURA AT HWY 71, SD',
    source: 'NWPS',
    issuedAgo: 'Issued less than a minute ago',
    expires: 'EXPIRES: SEE GAUGE / NWPS',
    read: false,
  },
  {
    id: '2',
    severity: 'MODERATE',
    title: 'Flood Watch',
    location: 'CHEYENNE RIVER ABOVE ANGOSTURA AT HWY 71, SD',
    source: 'NWPS',
    issuedAgo: 'Issued 12 minutes ago',
    expires: 'EXPIRES: SEE GAUGE / NWPS',
    read: false,
  },
  {
    id: '3',
    severity: 'LOW',
    title: 'Wind Advisory',
    location: 'WESTERN PLAINS REGION',
    source: 'NWS',
    issuedAgo: 'Issued 1 hour ago',
    expires: 'EXPIRES: 6:00 PM LOCAL',
    read: true,
  },
];

export const DEFAULT_WEATHER_ALERT_PREFERENCES: WeatherAlertPreference[] = [
  {
    id: 'flood-watch',
    label: 'Flood Watch',
    description: 'Notify when flood watches are issued for your area.',
    enabled: true,
  },
  {
    id: 'flood-warning',
    label: 'Flood Warning',
    description: 'Immediate alerts for active flood warnings.',
    enabled: true,
  },
  {
    id: 'severe-thunderstorm',
    label: 'Severe Thunderstorm',
    description: 'Watches and warnings for severe storms.',
    enabled: false,
  },
  {
    id: 'winter-weather',
    label: 'Winter Weather',
    description: 'Snow, ice, and blizzard advisories.',
    enabled: false,
  },
  {
    id: 'wind-advisory',
    label: 'Wind Advisory',
    description: 'High wind watches and advisories.',
    enabled: true,
  },
];
