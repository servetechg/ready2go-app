const E164_RE = /^\+[1-9]\d{6,14}$/;

/** US display: `1 555 123 4567` — 11 digits (1 + 10). */
export const US_PHONE_DIGIT_COUNT = 11;
export const US_PHONE_DISPLAY_PLACEHOLDER = '1 555 123 4567';
export const US_PHONE_DISPLAY_MAX_LENGTH = US_PHONE_DISPLAY_PLACEHOLDER.length;

/** Strip to digits only, max 11, ensure leading country digit `1`. */
export function extractUsPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, '').slice(0, US_PHONE_DIGIT_COUNT);
  if (digits.length === 0) return '';
  if (digits[0] !== '1') {
    digits = (`1${digits}`).slice(0, US_PHONE_DIGIT_COUNT);
  }
  return digits;
}

/** Format digits as `1 555 123 4567`. */
export function formatUsPhoneDisplay(digits: string): string {
  const d = extractUsPhoneDigits(digits);
  if (!d) return '';

  const country = d[0];
  const area = d.slice(1, 4);
  const mid = d.slice(4, 7);
  const last = d.slice(7, 11);

  let out = country;
  if (area.length) out += ` ${area}`;
  if (mid.length) out += ` ${mid}`;
  if (last.length) out += ` ${last}`;
  return out;
}

/** Apply display formatting while typing; rejects non-digit content beyond format length. */
export function formatUsPhoneInput(nextRaw: string, previousDisplay: string): string {
  const nextDigits = extractUsPhoneDigits(nextRaw);
  const prevDigits = extractUsPhoneDigits(previousDisplay);

  // Allow delete — fewer digits always ok
  if (nextDigits.length <= prevDigits.length) {
    return formatUsPhoneDisplay(nextDigits);
  }

  if (nextDigits.length > US_PHONE_DIGIT_COUNT) {
    return previousDisplay;
  }

  return formatUsPhoneDisplay(nextDigits);
}

export function e164ToPhoneDisplay(e164: string | undefined): string {
  if (!e164?.trim()) return '';
  const digits = e164.replace(/\D/g, '');
  if (digits.startsWith('1')) {
    return formatUsPhoneDisplay(digits.slice(0, US_PHONE_DIGIT_COUNT));
  }
  return formatUsPhoneDisplay((`1${digits}`).slice(0, US_PHONE_DIGIT_COUNT));
}

/** Normalize display or E.164 input to E.164 for `PATCH /users/me`. */
export function normalizePhoneForApi(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return '';

  if (E164_RE.test(trimmed)) return trimmed;

  const digits = extractUsPhoneDigits(trimmed);
  if (digits.length === US_PHONE_DIGIT_COUNT) {
    const candidate = `+${digits}`;
    return E164_RE.test(candidate) ? candidate : null;
  }

  if (digits.length === 10) {
    const candidate = `+1${digits}`;
    return E164_RE.test(candidate) ? candidate : null;
  }

  return null;
}

/** True if empty or a complete 11-digit US number in display form. */
export function isValidPhoneForApi(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return true;
  const digits = extractUsPhoneDigits(trimmed);
  if (digits.length === 0) return true;
  if (digits.length < US_PHONE_DIGIT_COUNT) return false;
  return normalizePhoneForApi(trimmed) !== null;
}

export function isCompleteUsPhoneDisplay(phone: string): boolean {
  return extractUsPhoneDigits(phone).length === US_PHONE_DIGIT_COUNT;
}
