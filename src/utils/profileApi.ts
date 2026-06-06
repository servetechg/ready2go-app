import type { PatchUserRequest, ProfilePayload } from '@/types/api';
import type { ApiUser } from '@/types/api';
import type { AlertLocation, RegistrationState } from '@/types/registration';
import { normalizePhoneForApi } from '@/utils/phone';
import { pickAddressData } from '@/utils/registration';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Omit client-generated ids so the server assigns UUIDs for new rows. */
export function toAlertLocationsRequestBody(
  locations: AlertLocation[],
): Array<Omit<AlertLocation, 'id'> & { id?: string }> {
  return locations.map(({ id, label, streetAddress, city, state, zipCode }) => {
    const row = { label, streetAddress, city, state, zipCode };
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

export function buildPatchProfileBody(
  registration: RegistrationState,
  updates: {
    streetAddress: string;
    city: string;
    state: string;
    householdSize: number;
  },
): Partial<ProfilePayload> | null {
  const nextAddress = pickAddressData({
    ...registration.address,
    streetAddress: updates.streetAddress.trim(),
    city: updates.city.trim(),
    state: updates.state,
  });
  const nextHousehold = updates.householdSize;

  const addressChanged =
    nextAddress.streetAddress !== registration.address.streetAddress ||
    nextAddress.city !== registration.address.city ||
    nextAddress.state !== registration.address.state ||
    nextAddress.zipCode !== registration.address.zipCode ||
    nextAddress.aptUnit !== registration.address.aptUnit;

  const householdChanged = nextHousehold !== registration.householdSize;

  if (!addressChanged && !householdChanged) return null;

  const body: Partial<ProfilePayload> = {};
  if (addressChanged) body.address = nextAddress;
  if (householdChanged) body.householdSize = nextHousehold;
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
