import { ENV } from '@/constants/env';
import { ApiClientError } from '@/services/api/errors';
import type { ApiErrorBody } from '@/types/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  /** Skip attaching Authorization even if token is passed */
  skipAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token, skipAuth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${ENV.API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!response.ok) {
    throw new ApiClientError(response.status, {
      message: data.message ?? `Request failed (${response.status})`,
      code: data.code,
      errors: data.errors,
    });
  }

  return data as T;
}

/** @deprecated Use apiRequest — kept for any legacy imports */
export const apiClient = apiRequest;
