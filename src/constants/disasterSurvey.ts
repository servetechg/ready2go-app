import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export const DISASTER_NOTIFICATION_SCREEN = 'disasterSurvey' as const;

export type DisasterSurveyCategoryId =
  | 'personal_household'
  | 'health_medical'
  | 'shelter_lodging'
  | 'food_supplies'
  | 'pets_livestock'
  | 'transportation'
  | 'other_assistance';

export type DisasterImmediateNeedId =
  | 'rescue_evacuation'
  | 'lodging_hotel'
  | 'food_supplies'
  | 'medical_assistance'
  | 'pet_rescue'
  | 'livestock_rescue'
  | 'transportation';

export const DISASTER_SURVEY_CATEGORIES: {
  id: DisasterSurveyCategoryId;
  title: string;
  icon: IconName;
}[] = [
  { id: 'personal_household', title: 'Personal & Household Information', icon: 'people' },
  { id: 'health_medical', title: 'Health & Medical Needs', icon: 'medkit' },
  { id: 'shelter_lodging', title: 'Shelter & Lodging', icon: 'home' },
  { id: 'food_supplies', title: 'Food & Supplies', icon: 'gift' },
  { id: 'pets_livestock', title: 'Pets & Livestock', icon: 'paw' },
  { id: 'transportation', title: 'Transportation', icon: 'car' },
  { id: 'other_assistance', title: 'Other Assistance', icon: 'briefcase' },
];

export const DISASTER_IMMEDIATE_NEEDS: {
  id: DisasterImmediateNeedId;
  label: string;
  icon: IconName;
}[] = [
  { id: 'rescue_evacuation', label: 'Rescue / Evacuation', icon: 'accessibility' },
  { id: 'lodging_hotel', label: 'Lodging (Hotel)', icon: 'bed' },
  { id: 'food_supplies', label: 'Food / Supplies', icon: 'restaurant' },
  { id: 'medical_assistance', label: 'Medical Assistance', icon: 'medkit' },
  { id: 'pet_rescue', label: 'Pet Rescue', icon: 'paw' },
  { id: 'livestock_rescue', label: 'Livestock Rescue', icon: 'nutrition' },
  { id: 'transportation', label: 'Transportation', icon: 'car' },
];
