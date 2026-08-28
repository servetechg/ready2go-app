import type {
  DashboardHomeNewsItem,
  MobilePreparednessCategory,
  MobileWeatherAlert,
  WeatherAlert,
} from '@/types/dashboard';
import type { PreparednessCategory } from '@/types/preparedness';
import type { EmergencyNewsItem, NewsCategory, NewsIconType } from '@/types/emergency';
import { extractAlertCoordinates } from '@/utils/alertCoordinates';
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

const LEGACY_NEWS_CATEGORIES: NewsCategory[] = ['ADVISORY', 'PREPAREDNESS', 'ADMIN', 'REGIONAL'];

function toNewsCategory(value: string | undefined): NewsCategory {
  if (!value) return 'ADVISORY';
  const upper = value.toUpperCase();
  if (LEGACY_NEWS_CATEGORIES.includes(upper as NewsCategory)) {
    return upper as NewsCategory;
  }
  return value.toLowerCase();
}

function toNewsIcon(icon: string | undefined): NewsIconType {
  const fallback: NewsIconType = 'newspaper-outline';
  if (!icon) return fallback;
  return icon as NewsIconType;
}

function toNewsSource(source: string): EmergencyNewsItem['source'] {
  if (source === 'admin') return 'admin';
  if (source === 'news') return 'news';
  if (source === 'community') return 'community';
  if (source === 'nws') return 'nws';
  return 'emergency';
}

function withNormalizedCoordinates(alert: WeatherAlert): WeatherAlert {
  const coords = extractAlertCoordinates(alert);
  if (!coords) return alert;

  return {
    ...alert,
    coordinates: { lat: coords.lat, lon: coords.lng },
    lat: coords.lat,
    lng: coords.lng,
  };
}

export function mapMobileAlertToWeatherAlert(alert: MobileWeatherAlert): WeatherAlert {
  const coords = extractAlertCoordinates(alert);
  const mapped: WeatherAlert = {
    id: alert.id,
    severity: alert.severity,
    title: alert.title || alert.name || 'Alert',
    name: alert.name,
    location: alert.location,
    source: alert.source,
    issuedAgo: formatIssuedLabel(alert.issuedAt),
    expires: alert.expiresLabel?.trim() || formatExpiresLabel(alert.expiresAt),
    read: alert.read,
    sourceUrl: alert.sourceUrl,
    lat: coords?.lat ?? alert.lat ?? alert.latitude ?? null,
    lng: coords?.lng ?? alert.lng ?? alert.longitude ?? null,
  };

  if (coords) {
    mapped.coordinates = { lat: coords.lat, lon: coords.lng };
  }

  return mapped;
}

/** Merge alert lists by id, keeping coordinate data when either source has it. */
export function mergeWeatherAlerts(...sources: WeatherAlert[][]): WeatherAlert[] {
  const byId = new Map<string, WeatherAlert>();

  for (const list of sources) {
    for (const alert of list) {
      const existing = byId.get(alert.id);
      if (!existing) {
        byId.set(alert.id, withNormalizedCoordinates(alert));
        continue;
      }

      const merged = withNormalizedCoordinates({ ...existing, ...alert });
      const coords =
        extractAlertCoordinates(merged) ??
        extractAlertCoordinates(alert) ??
        extractAlertCoordinates(existing);

      if (coords) {
        merged.coordinates = { lat: coords.lat, lon: coords.lng };
        merged.lat = coords.lat;
        merged.lng = coords.lng;
      }

      byId.set(alert.id, merged);
    }
  }

  return Array.from(byId.values());
}

/** @deprecated Use mapMobileAlertToWeatherAlert */
export const mapHomeAlertToWeatherAlert = mapMobileAlertToWeatherAlert;

export function mapHomeNewsToEmergencyNewsItem(item: DashboardHomeNewsItem): EmergencyNewsItem {
  const sourceName =
    item.source_name?.trim() ||
    item.sourceName?.trim() ||
    item.publisher?.trim() ||
    undefined;

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
    url: item.url,
    imageUrl: item.imageUrl,
    publisher: item.publisher,
    sourceName,
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
