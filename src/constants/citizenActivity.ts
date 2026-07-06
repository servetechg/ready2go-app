export type CitizenReportCategoryId =
  | 'help_request'
  | 'medical_assistance'
  | 'water_rescue'
  | 'road_hazard'
  | 'damage_report'
  | 'supply_request'
  | 'missing_person';

export const CITIZEN_REPORT_OPTIONS: {
  id: CitizenReportCategoryId;
  label: string;
  description: string;
}[] = [
  {
    id: 'help_request',
    label: 'General help',
    description: 'I need assistance but am not in immediate medical danger.',
  },
  {
    id: 'medical_assistance',
    label: 'Medical assistance',
    description: 'Injury, illness, or medication need.',
  },
  {
    id: 'water_rescue',
    label: 'Water / flooding',
    description: 'Rising water, trapped, or flood damage.',
  },
  {
    id: 'road_hazard',
    label: 'Road hazard',
    description: 'Blocked road, downed trees, or impassable route.',
  },
  {
    id: 'damage_report',
    label: 'Property damage',
    description: 'Home or structure damage needing assessment.',
  },
  {
    id: 'supply_request',
    label: 'Food / supplies',
    description: 'Food, water, prescriptions, or essentials.',
  },
  {
    id: 'missing_person',
    label: 'Missing person',
    description: 'Unable to reach a family member or neighbor.',
  },
];
