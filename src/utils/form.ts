import type { FieldError } from 'react-hook-form';

/** Ensure field errors are always strings before rendering in UI. */
export function fieldErrorMessage(error?: FieldError): string | undefined {
  if (!error?.message) return undefined;
  return typeof error.message === 'string' ? error.message : undefined;
}
