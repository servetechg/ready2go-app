import type { ProfilePayload } from '@/types/api';
import type { AddressData, AlertLocation, RegistrationState, YesNoStepData } from '@/types/registration';
import { initialYesNoStep } from '@/types/registration';

/** Keep only valid address fields (guards against polluted Redux / API shapes). */
export function pickAddressData(input: unknown): AddressData {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const nested =
    raw.address && typeof raw.address === 'object' && !Array.isArray(raw.address)
      ? (raw.address as Record<string, unknown>)
      : raw;

  return {
    streetAddress: String(nested.streetAddress ?? ''),
    aptUnit: String(nested.aptUnit ?? ''),
    city: String(nested.city ?? ''),
    state: String(nested.state ?? ''),
    zipCode: String(nested.zipCode ?? ''),
    useCurrentLocation: Boolean(nested.useCurrentLocation),
    ...(typeof nested.latitude === 'number' && !Number.isNaN(nested.latitude)
      ? { latitude: nested.latitude }
      : {}),
    ...(typeof nested.longitude === 'number' && !Number.isNaN(nested.longitude)
      ? { longitude: nested.longitude }
      : {}),
  };
}

export function coerceHouseholdSize(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Math.min(50, Math.max(1, Math.floor(value)));
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return Math.min(50, Math.max(1, Math.floor(parsed)));
    }
  }
  return 1;
}

function pickYesNoStep(input: unknown): YesNoStepData {
  const raw = input && typeof input === 'object' ? (input as YesNoStepData) : initialYesNoStep();
  return {
    hasRequirement:
      raw.hasRequirement === null || raw.hasRequirement === undefined
        ? null
        : Boolean(raw.hasRequirement),
    selectedOptions: Array.isArray(raw.selectedOptions) ? raw.selectedOptions.map(String) : [],
    otherDetails: raw.otherDetails != null ? String(raw.otherDetails) : '',
  };
}

export function pickAlertLocations(input: unknown): AlertLocation[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      const city = String(raw.city ?? '').trim();
      const state = String(raw.state ?? '').trim();
      if (!city && !state) return null;
      return {
        id: String(raw.id ?? `loc-${index}`),
        label: String(raw.label ?? '').trim(),
        streetAddress: String(raw.streetAddress ?? '').trim(),
        city,
        state,
        zipCode: String(raw.zipCode ?? '').trim(),
      };
    })
    .filter((loc): loc is AlertLocation => loc !== null);
}

function pickLodging(input: unknown): RegistrationState['lodging'] {
  const raw = input && typeof input === 'object' ? (input as RegistrationState['lodging']) : null;
  return {
    selectedOptions: Array.isArray(raw?.selectedOptions) ? raw.selectedOptions.map(String) : [],
    otherDetails: raw?.otherDetails != null ? String(raw.otherDetails) : '',
  };
}

/** Normalize API profile blobs into ProfilePayload. */
export function normalizeProfilePayload(input: unknown): ProfilePayload | null {
  if (!input || typeof input !== 'object') return null;

  const raw = input as Record<string, unknown>;
  const source =
    raw.profile && typeof raw.profile === 'object'
      ? (raw.profile as Record<string, unknown>)
      : raw;

  const address = pickAddressData(source.address ?? source);
  if (!address.streetAddress && !address.city && !address.zipCode) {
    return null;
  }

  return {
    address,
    householdSize: coerceHouseholdSize(source.householdSize),
    ada: pickYesNoStep(source.ada),
    medical: pickYesNoStep(source.medical),
    pets: pickYesNoStep(source.pets),
    transport: pickYesNoStep(source.transport),
    lodging: pickLodging(source.lodging),
  };
}

/** Sanitize full registration slice (persist rehydrate + after bad writes). */
export function normalizeRegistrationState(state: RegistrationState): RegistrationState {
  return {
    currentStep:
      typeof state.currentStep === 'number' && state.currentStep >= 1 && state.currentStep <= 8
        ? state.currentStep
        : 1,
    isComplete: Boolean(state.isComplete),
    isStarted: Boolean(state.isStarted),
    needsAccount: Boolean(state.needsAccount),
    address: pickAddressData(state.address),
    householdSize: coerceHouseholdSize(state.householdSize),
    ada: pickYesNoStep(state.ada),
    medical: pickYesNoStep(state.medical),
    pets: pickYesNoStep(state.pets),
    transport: pickYesNoStep(state.transport),
    lodging: pickLodging(state.lodging),
    alertLocations: pickAlertLocations(state.alertLocations),
  };
}
