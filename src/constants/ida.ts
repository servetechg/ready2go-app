export const IDA_HOUSING_DAMAGE_IDS = [
  'no_damage',
  'minor_damage',
  'moderate_damage',
  'major_damage',
  'destroyed',
  'unknown',
] as const;
export type IdaHousingDamageId = (typeof IDA_HOUSING_DAMAGE_IDS)[number];

export const IDA_SAFE_TO_LIVE_IDS = ['yes', 'no', 'unsure'] as const;
export type IdaSafeToLiveId = (typeof IDA_SAFE_TO_LIVE_IDS)[number];

export const IDA_LIVING_SITUATION_IDS = [
  'home',
  'hotel',
  'shelter',
  'friends_family',
  'vehicle',
  'other',
] as const;
export type IdaLivingSituationId = (typeof IDA_LIVING_SITUATION_IDS)[number];

export const IDA_IMMEDIATE_NEED_IDS = [
  'food',
  'drinking_water',
  'temporary_housing',
  'medical_assistance',
  'prescription_medications',
  'transportation',
  'fuel',
  'clothing',
  'child_care',
  'elder_care',
  'pet_assistance',
  'mental_health_support',
  'debris_removal',
  'generator',
  'other',
] as const;
export type IdaImmediateNeedId = (typeof IDA_IMMEDIATE_NEED_IDS)[number];

export const IDA_INSURANCE_TYPE_IDS = [
  'homeowners',
  'renters',
  'flood',
  'vehicle',
  'business',
  'none',
] as const;
export type IdaInsuranceTypeId = (typeof IDA_INSURANCE_TYPE_IDS)[number];

export const IDA_FINANCIAL_IMPACT_IDS = [
  'under_5k',
  '5k_25k',
  '25k_50k',
  '50k_100k',
  'over_100k',
  'unknown',
] as const;
export type IdaFinancialImpactId = (typeof IDA_FINANCIAL_IMPACT_IDS)[number];

export const IDA_DOCUMENT_KIND_IDS = [
  'gov_id',
  'insurance_policy',
  'damage_photo',
  'utility_bill',
  'lease_or_deed',
] as const;
export type IdaDocumentKindId = (typeof IDA_DOCUMENT_KIND_IDS)[number];

export const IDA_MISSING_FIELD_IDS = [
  'documents',
  'insurance_company',
  'current_location',
] as const;
export type IdaMissingFieldId = (typeof IDA_MISSING_FIELD_IDS)[number];

export type IdaApplicantPrefill = {
  fullName: string;
  dateOfBirth?: string;
  phoneNumber: string;
  email: string;
  preferredContactMethod?: string;
  currentLocation?: string;
  lat?: number | null;
  lng?: number | null;
  preferredLanguage?: string;
};

export type IdaHouseholdPrefill = {
  disasterAffectedAddress: string;
  isPrimaryResidence?: boolean | null;
  householdSize?: number | null;
  adults?: number | null;
  children?: number | null;
  seniors?: number | null;
  disabilitiesOrAccessNeeds?: string;
  electricityDependentMedical?: string;
  petsOrLivestock?: string;
};

export type IdaDisasterPrefill = {
  disasterType: string;
  dateOfImpact: string;
};

export const IDA_HOUSING_DAMAGE_LABELS: Record<IdaHousingDamageId, string> = {
  no_damage: 'No damage',
  minor_damage: 'Minor damage',
  moderate_damage: 'Moderate damage',
  major_damage: 'Major damage',
  destroyed: 'Destroyed',
  unknown: 'Unknown',
};

export const IDA_SAFE_TO_LIVE_LABELS: Record<IdaSafeToLiveId, string> = {
  yes: 'Yes',
  no: 'No',
  unsure: 'Unsure',
};

export const IDA_LIVING_SITUATION_LABELS: Record<IdaLivingSituationId, string> = {
  home: 'At home',
  hotel: 'Hotel / motel',
  shelter: 'Shelter',
  friends_family: 'Friends or family',
  vehicle: 'Vehicle',
  other: 'Other',
};

export const IDA_IMMEDIATE_NEED_LABELS: Record<IdaImmediateNeedId, string> = {
  food: 'Food',
  drinking_water: 'Drinking water',
  temporary_housing: 'Temporary housing',
  medical_assistance: 'Medical assistance',
  prescription_medications: 'Prescription medications',
  transportation: 'Transportation',
  fuel: 'Fuel',
  clothing: 'Clothing',
  child_care: 'Child care',
  elder_care: 'Elder care',
  pet_assistance: 'Pet assistance',
  mental_health_support: 'Mental health support',
  debris_removal: 'Debris removal',
  generator: 'Generator',
  other: 'Other',
};

export const IDA_INSURANCE_TYPE_LABELS: Record<IdaInsuranceTypeId, string> = {
  homeowners: 'Homeowners',
  renters: 'Renters',
  flood: 'Flood',
  vehicle: 'Vehicle',
  business: 'Business',
  none: 'None',
};

export const IDA_FINANCIAL_IMPACT_LABELS: Record<IdaFinancialImpactId, string> = {
  under_5k: 'Under $5,000',
  '5k_25k': '$5,000 – $25,000',
  '25k_50k': '$25,000 – $50,000',
  '50k_100k': '$50,000 – $100,000',
  over_100k: 'Over $100,000',
  unknown: 'Unknown',
};

export const IDA_DOCUMENT_KIND_LABELS: Record<IdaDocumentKindId, string> = {
  gov_id: 'Government ID',
  insurance_policy: 'Insurance policy',
  damage_photo: 'Damage photo',
  utility_bill: 'Utility bill',
  lease_or_deed: 'Lease or deed',
};

/** Short intro header copy (full disclaimer lives on the intro screen). */
export const IDA_DEFAULT = {
  title: 'Initial Disaster Assistance Application',
  description:
    'If your property or possessions were damaged, complete this application to start reimbursement. Allow at least 3 days after the disaster for agencies and insurers to respond.',
} as const;
