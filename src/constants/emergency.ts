import type { EmergencyDashboardData, EmergencyNewsItem } from '@/types/emergency';

/** Default map center (Lake County IL area — matches sample incident log). */
export const DEFAULT_MAP_REGION = {
  latitude: 42.3256,
  longitude: -87.8412,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
} as const;

/** Blue sky — emergency-only news + admin broadcasts (no active local disruption). */
export const MOCK_BLUE_SKY_NEWS: EmergencyNewsItem[] = [
  {
    id: 'news-1',
    title: 'Update your emergency profile for faster relief',
    body: 'Accurate household, pet, ADA, and lodging details help Ready2Go book hotels and issue relief funding within the first 72 hours after a disruption.',
    timestamp: new Date(Date.now() - 45 * 60_000).toISOString(),
    source: 'admin',
    severity: 'info',
    category: 'ADMIN',
    icon: 'megaphone-outline',
  },
  {
    id: 'news-2',
    title: 'Severe weather preparedness week — Illinois',
    body: 'No active disruptions in your registered area. Review your preparedness checklist and optional alert locations for family in other states.',
    timestamp: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
    source: 'emergency',
    severity: 'info',
    category: 'PREPAREDNESS',
    location: 'LAKE COUNTY, IL — YOUR REGISTERED AREA',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'news-3',
    title: 'Gulf Coast hurricane watch — advisory only',
    body: 'Tropical system developing in the Gulf. Not affecting your home location. Alerts enabled for your optional California monitoring zone.',
    timestamp: new Date(Date.now() - 8 * 60 * 60_000).toISOString(),
    source: 'emergency',
    severity: 'warning',
    category: 'ADVISORY',
    location: 'GULF COAST REGION — MONITORED ZONE',
    icon: 'globe-outline',
  },
  {
    id: 'news-4',
    title: 'FEMA bridge program — how Ready2Go coordinates relief',
    body: 'Ready2Go provides immediate lodging and essentials while FEMA and nonprofits mobilize. See FAQs for eligibility and documentation requirements.',
    timestamp: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    source: 'emergency',
    severity: 'info',
    category: 'ADVISORY',
    icon: 'newspaper-outline',
  },
  {
    id: 'news-5',
    title: 'Community shelter network drill completed',
    body: 'Regional partners verified shelter capacity maps. No action needed. This was a scheduled exercise only.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
    source: 'admin',
    severity: 'info',
    category: 'REGIONAL',
    location: 'NORTHEASTERN ILLINOIS',
    icon: 'medkit-outline',
  },
  {
    id: 'news-6',
    title: 'Emergency alert system test — next Tuesday',
    body: 'You may receive a test notification. Confirm your phone allows Ready2Go alerts in device settings.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60_000).toISOString(),
    source: 'admin',
    severity: 'info',
    category: 'ADMIN',
    icon: 'alert-circle-outline',
  },
];

export const MOCK_CLOUDY_INCIDENT_LOG = [
  {
    id: 'log-1',
    message: '2945 Waukegan Rd — CVS closed',
    timestamp: '2026-06-03T14:45:00Z',
    latitude: 42.3189,
    longitude: -87.8441,
  },
  {
    id: 'log-2',
    message: 'Community shelter closed — Zion Township',
    timestamp: '2026-06-03T14:30:00Z',
    latitude: 42.4462,
    longitude: -87.8321,
  },
  {
    id: 'log-3',
    message: 'Waukegan Rd — road flooding reported',
    timestamp: '2026-06-03T14:15:00Z',
    latitude: 42.3251,
    longitude: -87.8398,
  },
  {
    id: 'log-4',
    message: 'Open shelter — North Chicago High School gym',
    timestamp: '2026-06-03T13:50:00Z',
    latitude: 42.3164,
    longitude: -87.8415,
  },
];

export const MOCK_CLOUDY_MAP_MARKERS = [
  {
    id: 'm-1',
    title: 'CVS closed',
    description: '2945 Waukegan Rd',
    latitude: 42.3189,
    longitude: -87.8441,
    type: 'closure' as const,
  },
  {
    id: 'm-2',
    title: 'Shelter closed',
    description: 'Zion Township community shelter',
    latitude: 42.4462,
    longitude: -87.8321,
    type: 'closure' as const,
  },
  {
    id: 'm-3',
    title: 'Road flooding',
    description: 'Waukegan Rd',
    latitude: 42.3251,
    longitude: -87.8398,
    type: 'hazard' as const,
  },
  {
    id: 'm-4',
    title: 'Open shelter',
    description: 'North Chicago High School gym',
    latitude: 42.3164,
    longitude: -87.8415,
    type: 'shelter' as const,
  },
];

export const MOCK_CLOUDY_NEWS = [
  {
    id: 'cloudy-news-1',
    title: 'Major disruption — Lake County',
    body: 'Ready2Go has activated emergency services for your area. Complete the relief survey when you receive it.',
    timestamp: '2026-06-03T12:00:00Z',
    source: 'emergency' as const,
    severity: 'critical' as const,
    category: 'ADVISORY' as const,
    icon: 'alert-circle-outline' as const,
  },
  {
    id: 'cloudy-news-2',
    title: 'Message from emergency administrators',
    body: 'Use the incident map and log below for road closures and shelter status. Call 911 for life-threatening emergencies.',
    timestamp: '2026-06-03T12:05:00Z',
    source: 'admin' as const,
    severity: 'warning' as const,
    category: 'ADMIN' as const,
    icon: 'megaphone-outline' as const,
  },
];

export function buildMockEmergencyDashboard(mode: 'blue_sky' | 'cloudy'): EmergencyDashboardData {
  if (mode === 'cloudy') {
    return {
      mode: 'cloudy',
      news: MOCK_CLOUDY_NEWS,
      incidentLog: MOCK_CLOUDY_INCIDENT_LOG,
      mapMarkers: MOCK_CLOUDY_MAP_MARKERS,
      mapRegion: { ...DEFAULT_MAP_REGION },
    };
  }

  return {
    mode: 'blue_sky',
    news: MOCK_BLUE_SKY_NEWS,
    incidentLog: [],
    mapMarkers: [],
    mapRegion: { ...DEFAULT_MAP_REGION },
  };
}
