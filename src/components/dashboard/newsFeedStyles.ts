import { palette } from '@/theme';
import type { NewsCategory } from '@/types/emergency';

const LEGACY_CATEGORY_STYLES: Record<
  'ADVISORY' | 'PREPAREDNESS' | 'ADMIN' | 'REGIONAL',
  { bg: string; text: string; border: string }
> = {
  ADVISORY: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  PREPAREDNESS: { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  ADMIN: { bg: '#EDE7F6', text: '#4527A0', border: '#B39DDB' },
  REGIONAL: { bg: palette.accent, text: palette.tabActive, border: palette.border },
};

const DISASTER_CATEGORY_STYLE = { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' };
const DEFAULT_CATEGORY_STYLE = { bg: '#ECEFF1', text: '#455A64', border: '#CFD8DC' };

export function formatCategoryLabel(category: NewsCategory): string {
  const label = category.replace(/_/g, ' ');
  if (label === label.toUpperCase()) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getCategoryStyle(category: NewsCategory) {
  const upper = category.toUpperCase();
  if (upper in LEGACY_CATEGORY_STYLES) {
    return LEGACY_CATEGORY_STYLES[upper as keyof typeof LEGACY_CATEGORY_STYLES];
  }
  const lower = category.toLowerCase();
  if (['wildfire', 'flood', 'tornado', 'hurricane', 'earthquake', 'tsunami'].includes(lower)) {
    return DISASTER_CATEGORY_STYLE;
  }
  return DEFAULT_CATEGORY_STYLE;
}
