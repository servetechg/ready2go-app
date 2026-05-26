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
