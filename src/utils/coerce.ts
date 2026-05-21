/** Coerce persisted / form values to strict booleans for native Android props */
export function toBoolean(value: unknown): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  return false;
}
