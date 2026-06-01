import type { AddressData } from '@/types/registration';

export function formatAddressLine(address: AddressData): string {
  const parts = [
    address.streetAddress,
    address.aptUnit ? `Unit ${address.aptUnit}` : '',
    address.city,
    address.state,
    address.zipCode,
  ].filter(Boolean);

  return parts.join(', ') || 'Address not set';
}
