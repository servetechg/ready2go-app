import type {
  DashboardHomeNewsItem,
  MobilePreparednessCategory,
  MobileWeatherAlert,
  WeatherAlert,
} from '@/types/dashboard';
import type { PreparednessCategory } from '@/types/preparedness';
import type { EmergencyNewsItem, NewsCategory, NewsIconType } from '@/types/emergency';
import { formatExpiresLabel, formatIssuedLabel } from '@/utils/formatTimestamp';
import {
  formatPreparednessText,
  formatPreparednessTitle,
} from '@/utils/preparednessLabels';

const PREPAREDNESS_ICON_ALIASES: Record<string, string> = {
  flame: 'flame',
  medkit: 'medkit',
  globe: 'globe',
  location: 'location',
  'globe-outline': 'globe',
  'medkit-outline': 'medkit',
  'location-outline': 'location',
  'flame-outline': 'flame',
};

const NEWS_CATEGORY_VALUES: NewsCategory[] = ['ADVISORY', 'PREPAREDNESS', 'ADMIN', 'REGIONAL'];

function toNewsCategory(value: string | undefined): NewsCategory {
  const upper = (value ?? 'ADVISORY').toUpperCase();
  return NEWS_CATEGORY_VALUES.includes(upper as NewsCategory)
    ? (upper as NewsCategory)
    : 'ADVISORY';
}

function toNewsIcon(icon: string | undefined): NewsIconType {
  const fallback: NewsIconType = 'newspaper-outline';
  if (!icon) return fallback;
  return icon as NewsIconType;
}

function toNewsSource(source: string): EmergencyNewsItem['source'] {
  if (source === 'admin') return 'admin';
  return 'emergency';
}

export function mapMobileAlertToWeatherAlert(alert: MobileWeatherAlert): WeatherAlert {
  return {
    id: alert.id,
    severity: alert.severity,
    title: alert.title,
    location: alert.location,
    source: alert.source,
    issuedAgo: formatIssuedLabel(alert.issuedAt),
    expires: alert.expiresLabel?.trim() || formatExpiresLabel(alert.expiresAt),
    read: alert.read,
    sourceUrl: alert.sourceUrl,
  };
}

/** @deprecated Use mapMobileAlertToWeatherAlert */
export const mapHomeAlertToWeatherAlert = mapMobileAlertToWeatherAlert;

export function mapHomeNewsToEmergencyNewsItem(item: DashboardHomeNewsItem): EmergencyNewsItem {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    timestamp: item.timestamp,
    source: toNewsSource(item.source),
    severity:
      item.severity === 'critical' || item.severity === 'warning' || item.severity === 'info'
        ? item.severity
        : undefined,
    category: toNewsCategory(item.category),
    location: item.location || undefined,
    icon: toNewsIcon(item.icon),
  };
}

export function mapPreparednessCategory(category: MobilePreparednessCategory): PreparednessCategory {
  const iconKey = category.icon.toLowerCase();
  return {
    id: category.id,
    title: formatPreparednessTitle(category.title, category.id),
    subtitle: formatPreparednessText(category.subtitle),
    icon: PREPAREDNESS_ICON_ALIASES[iconKey] ?? category.icon,
    taskCount: category.taskCount,
    sortOrder: 0,
  };
}
