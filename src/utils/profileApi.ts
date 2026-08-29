import type { PatchUserRequest, ProfilePayload } from '@/types/api';
import type { ApiUser } from '@/types/api';
import type { AlertLocation, RegistrationState, YesNoStepData } from '@/types/registration';
import { normalizePhoneForApi } from '@/utils/phone';
import { pickAddressData } from '@/utils/registration';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Alert rows for onboarding complete — no street address; server assigns UUIDs. */
export function toAlertLocationsForComplete(
  locations: AlertLocation[],
): Array<{ id?: string; label: string; city: string; state: string; zipCode?: string }> {
  return locations.map(({ id, label, city, state, zipCode }) => {
    const row = {
      label: label.trim(),
      city: city.trim(),
      state: state.trim(),
      ...(zipCode.trim() ? { zipCode: zipCode.trim() } : {}),
    };
    return UUID_RE.test(id) ? { id, ...row } : row;
  });
}

/** Omit client-generated ids so the server assigns UUIDs for new rows. */
export function toAlertLocationsRequestBody(
  locations: AlertLocation[],
): Array<Omit<AlertLocation, 'id'> & { id?: string }> {
  return locations.map(({ id, label, streetAddress, city, state, zipCode }) => {
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const row = {
      label: label.trim() || `${trimmedCity}, ${trimmedState}`,
      streetAddress: streetAddress?.trim() || undefined,
      city: trimmedCity,
      state: trimmedState,
      ...(zipCode?.trim() ? { zipCode: zipCode.trim() } : {}),
    };
    return UUID_RE.test(id) ? { id, ...row } : row;
  });
}

export function buildPatchUserBody(
  user: ApiUser,
  updates: { firstName: string; lastName: string; email: string; phone: string },
): PatchUserRequest | null {
  const body: PatchUserRequest = {};
  const email = updates.email.trim();

  if (updates.firstName !== user.firstName) body.firstName = updates.firstName;
  if (updates.lastName !== user.lastName) body.lastName = updates.lastName;
  if (email !== user.email) body.email = email;

  const phoneRaw = updates.phone.trim();
  const currentPhone = user.phone ?? '';
  if (phoneRaw) {
    const normalized = normalizePhoneForApi(phoneRaw);
    if (normalized && normalized !== currentPhone) {
      body.phone = normalized;
    }
  } else if (currentPhone) {
    body.phone = '';
  }

  return Object.keys(body).length > 0 ? body : null;
}

function requirementSectionChanged(a: YesNoStepData, b: YesNoStepData): boolean {
  return (
    a.hasRequirement !== b.hasRequirement ||
    JSON.stringify(a.selectedOptions ?? []) !== JSON.stringify(b.selectedOptions ?? []) ||
    (a.otherDetails ?? '') !== (b.otherDetails ?? '')
  );
}

export function buildPatchProfileBody(
  registration: RegistrationState,
  updates: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    useCurrentLocation?: boolean;
    householdSize: number;
    isPrimaryAddress?: boolean | null;
    allowResidenceInspection?: boolean | null;
    ada?: YesNoStepData;
    pets?: YesNoStepData;
  },
): Partial<ProfilePayload> | null {
  const nextAddress = pickAddressData({
    ...registration.address,
    streetAddress: updates.streetAddress.trim(),
    city: updates.city.trim(),
    state: updates.state,
    ...(updates.zipCode !== undefined ? { zipCode: updates.zipCode.trim() } : {}),
    ...(updates.latitude !== undefined ? { latitude: updates.latitude } : {}),
    ...(updates.longitude !== undefined ? { longitude: updates.longitude } : {}),
    ...(updates.useCurrentLocation !== undefined
      ? { useCurrentLocation: updates.useCurrentLocation }
      : {}),
  });
  const nextHousehold = updates.householdSize;

  const addressChanged =
    nextAddress.streetAddress !== registration.address.streetAddress ||
    nextAddress.city !== registration.address.city ||
    nextAddress.state !== registration.address.state ||
    nextAddress.zipCode !== registration.address.zipCode ||
    nextAddress.aptUnit !== registration.address.aptUnit ||
    nextAddress.latitude !== registration.address.latitude ||
    nextAddress.longitude !== registration.address.longitude ||
    nextAddress.useCurrentLocation !== registration.address.useCurrentLocation;

  const householdChanged = nextHousehold !== registration.householdSize;
  const primaryChanged =
    updates.isPrimaryAddress !== undefined &&
    updates.isPrimaryAddress !== registration.isPrimaryAddress;
  const inspectionChanged =
    updates.allowResidenceInspection !== undefined &&
    updates.allowResidenceInspection !== registration.allowResidenceInspection;
  const adaChanged =
    updates.ada !== undefined && requirementSectionChanged(updates.ada, registration.ada);
  const petsChanged =
    updates.pets !== undefined && requirementSectionChanged(updates.pets, registration.pets);

  if (
    !addressChanged &&
    !householdChanged &&
    !primaryChanged &&
    !inspectionChanged &&
    !adaChanged &&
    !petsChanged
  ) {
    return null;
  }

  const body: Partial<ProfilePayload> = {};
  if (addressChanged) body.address = nextAddress;
  if (householdChanged) body.householdSize = nextHousehold;
  if (primaryChanged && updates.isPrimaryAddress !== null && updates.isPrimaryAddress !== undefined) {
    body.isPrimaryAddress = updates.isPrimaryAddress;
  }
  if (
    inspectionChanged &&
    updates.allowResidenceInspection !== null &&
    updates.allowResidenceInspection !== undefined
  ) {
    body.allowResidenceInspection = updates.allowResidenceInspection;
  }
  if (adaChanged && updates.ada) body.ada = updates.ada;
  if (petsChanged && updates.pets) body.pets = updates.pets;
  return body;
}

export function alertLocationsChanged(a: AlertLocation[], b: AlertLocation[]): boolean {
  if (a.length !== b.length) return true;
  return a.some((loc, i) => {
    const other = b[i];
    return (
      loc.id !== other.id ||
      loc.label !== other.label ||
      loc.streetAddress !== other.streetAddress ||
      loc.city !== other.city ||
      loc.state !== other.state ||
      loc.zipCode !== other.zipCode
    );
  });
}
