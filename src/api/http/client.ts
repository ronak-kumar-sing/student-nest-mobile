/**
 * Core HTTP client built on global fetch.
 *
 * Handles:
 * - Base URL resolution with trailing slash removal
 * - Pluggable bearer token injection & single 401 retry with forced refresh
 * - Query array serialization as repeated keys
 * - Idempotency-Key headers
 * - Standard ApiError envelope parsing
 * - TanStack Query abort signal passthrough
 */

import { ApiError, ErrorCodes, createApiError, createNetworkError, isApiError } from '@/api/errors';
import { getAuthToken } from './token';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryValue = string | number | boolean | readonly (string | number)[] | null | undefined;

export interface ApiRequestOptions {
  method?: HttpMethod;
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  auth?: 'required' | 'optional' | 'none';
}

/**
 * Get the API base URL from EXPO_PUBLIC_API_URL, stripped of trailing slashes.
 * Defaults to http://localhost:3000 if not set or invalid.
 */
export function getApiBaseUrl(): string {
  const rawUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!rawUrl || rawUrl === 'undefined') {
    return 'http://localhost:3000';
  }
  return rawUrl.replace(/\/+$/, '');
}

/**
 * Generate a UUID v4 idempotency key.
 * Uses globalThis.crypto.randomUUID if available, else a Math.random fallback.
 */
export function createIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Serializes query parameters.
 * Arrays are formatted as repeated keys: `key=val1&key=val2`.
 * Skips undefined, null, and empty-string values.
 */
export function serializeQuery(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const pairs: string[] = [];

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== '') {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
        }
      }
    } else {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

/**
 * Execute a typed HTTP request against the backend API.
 */
export async function apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const method = options?.method ?? 'GET';
  const authMode = options?.auth ?? 'required';

  // 1. Resolve auth token
  let token: string | null = null;
  if (authMode !== 'none') {
    token = await getAuthToken({ forceRefresh: false });
    if (authMode === 'required' && !token) {
      throw new ApiError({
        code: ErrorCodes.UNAUTHENTICATED,
        message: 'Authentication required',
        statusCode: 401,
      });
    }
  }

  // 2. Prepare headers (immutable per request attempt)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options?.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  let bodyInit: string | undefined;
  if (options?.body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    bodyInit = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  // 3. Construct URL
  const queryString = serializeQuery(options?.query);
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (queryString) {
    normalizedPath += normalizedPath.includes('?') ? `&${queryString.slice(1)}` : queryString;
  }
  const url = `${getApiBaseUrl()}${normalizedPath}`;

  const requestInit: RequestInit = {
    method,
    headers,
    signal: options?.signal,
    body: bodyInit,
  };

  let response: Response;

  try {
    response = await fetch(url, requestInit);

    // 4. Handle 401 token refresh & retry (only if an initial token was sent)
    if (response.status === 401 && token) {
      const refreshedToken = await getAuthToken({ forceRefresh: true });
      if (refreshedToken) {
        // Build new headers and requestInit without mutating the original headers object
        const retryHeaders: Record<string, string> = {
          ...headers,
          Authorization: `Bearer ${refreshedToken}`,
        };
        const retryInit: RequestInit = {
          ...requestInit,
          headers: retryHeaders,
        };
        response = await fetch(url, retryInit);
      }
    }
  } catch (err: unknown) {
    // TanStack Query cancellation: re-throw aborts unchanged
    if (options?.signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
      throw err;
    }
    if (isApiError(err)) {
      throw err;
    }
    throw createNetworkError(err);
  }

  // 5. Check response status
  if (!response.ok) {
    throw await createApiError(response);
  }

  // 6. Handle 204 or empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

/**
 * Convenience HTTP verb helpers.
 */
export const http = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
