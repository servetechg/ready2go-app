import { Ionicons } from '@expo/vector-icons';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  flame: 'flame-outline',
  earth: 'globe-outline',
  globe: 'globe-outline',
  water: 'water-outline',
  storm: 'thunderstorm-outline',
  shield: 'shield-outline',
  medkit: 'medkit-outline',
  location: 'location-outline',
};

export function preparednessIconName(icon: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[icon] ?? 'book-outline';
}
