import type {
  PreparednessCategory,
  WeatherAlert,
  WeatherAlertPreference,
  WeatherSnapshot,
} from '@/types/dashboard';

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

export const PREPAREDNESS_CATEGORIES: PreparednessCategory[] = [
  {
    id: 'active-shooter',
    title: 'Active Shooter Preparedness',
    subtitle: 'Active Shooter Preparedness',
    icon: 'flame',
    taskCount: 0,
  },
  {
    id: 'choking',
    title: 'Choking First Aid',
    subtitle: 'Choking First Aid',
    icon: 'medkit',
    taskCount: 0,
  },
  {
    id: 'evacuation',
    title: 'Community Evacuation',
    subtitle: 'Community Evacuation',
    icon: 'globe',
    taskCount: 0,
  },
  {
    id: 'shelter',
    title: 'General Shelter-in-Place',
    subtitle: 'General Shelter-in-Place',
    icon: 'location',
    taskCount: 0,
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
