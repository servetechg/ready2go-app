import type { ApiErrorBody } from '@/types/api';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly errors?: ApiErrorBody['errors'];

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || `Request failed (${status})`);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.code;
    this.errors = body.errors;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

/** Access token rejected — refresh + retry is appropriate when a refresh token exists. */
export function isUnauthorizedError(error: unknown): boolean {
  if (!isApiClientError(error)) return false;
  if (error.code === 'INVALID_REFRESH_TOKEN') return false;
  if (error.status === 401) return true;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('invalid or expired token') ||
    msg.includes('expired token') ||
    msg.includes('invalid token') ||
    msg.includes('jwt expired') ||
    msg.includes('token expired')
  );
}

/** Refresh token rejected — local session must be cleared. */
export function isInvalidRefreshError(error: unknown): boolean {
  if (!isApiClientError(error)) return false;
  if (error.code === 'INVALID_REFRESH_TOKEN') return true;
  if (error.status !== 401) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('refresh token');
}
