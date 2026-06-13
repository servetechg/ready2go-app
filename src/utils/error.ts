import { isApiClientError } from '@/services/api/errors';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error === 'string') return error;
  if (isApiClientError(error)) {
    if (error.errors?.length) {
      const detail = error.errors.map((e) => e.message).filter(Boolean).join('. ');
      if (detail) return detail;
    }
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}
