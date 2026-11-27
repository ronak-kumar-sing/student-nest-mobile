/**
 * API error handling.
 *
 * All backend errors follow the envelope:
 * ```json
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable message (don't switch on this)",
 *     "details": [{ "field": "...", "issue": "..." }]
 *   },
 *   "requestId": "uuid"
 * }
 * ```
 *
 * **Rule:** Always switch on `error.code`, never on `message`.
 */

// ─── Error Codes ────────────────────────────────────────────────────

export const ErrorCodes = {
  // General
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Auth
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_LOCKED: 'OTP_LOCKED',
  ALREADY_REGISTERED: 'ALREADY_REGISTERED',
  /** Signed in with Firebase but POST /v1/auth/signup not done yet (403). */
  PROFILE_REQUIRED: 'PROFILE_REQUIRED',
  PHONE_REQUIRED: 'PHONE_REQUIRED',
  KYC_REQUIRED: 'KYC_REQUIRED',

  // Account
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',

  // Property & Search
  PROPERTY_UNAVAILABLE: 'PROPERTY_UNAVAILABLE',
  FAVORITES_LIMIT: 'FAVORITES_LIMIT',
  SEARCH_UNAVAILABLE: 'SEARCH_UNAVAILABLE',
  CURSOR_MISMATCH: 'CURSOR_MISMATCH',
  LOCATION_UNSUPPORTED: 'LOCATION_UNSUPPORTED',

  // Booking & Transact
  BOOKING_SLOT_TAKEN: 'BOOKING_SLOT_TAKEN',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  DUPLICATE_APPLICATION: 'DUPLICATE_APPLICATION',
  TOO_MANY_PENDING: 'TOO_MANY_PENDING',
  GENDER_POLICY_MISMATCH: 'GENDER_POLICY_MISMATCH',

  // Security
  APP_CHECK_FAILED: 'APP_CHECK_FAILED',

  // Client-side only
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ─── Error → i18n Key Map ───────────────────────────────────────────

const errorI18nMap: Record<string, string> = {
  [ErrorCodes.VALIDATION_FAILED]: 'errors.VALIDATION_FAILED',
  [ErrorCodes.UNAUTHENTICATED]: 'errors.UNAUTHENTICATED',
  [ErrorCodes.FORBIDDEN]: 'errors.FORBIDDEN',
  [ErrorCodes.NOT_FOUND]: 'errors.NOT_FOUND',
  [ErrorCodes.INVALID_TRANSITION]: 'errors.INVALID_TRANSITION',
  [ErrorCodes.RATE_LIMITED]: 'errors.RATE_LIMITED',
  [ErrorCodes.INTERNAL_ERROR]: 'errors.INTERNAL_ERROR',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'errors.SERVICE_UNAVAILABLE',

  [ErrorCodes.OTP_INVALID]: 'errors.OTP_INVALID',
  [ErrorCodes.OTP_EXPIRED]: 'errors.OTP_EXPIRED',
  [ErrorCodes.OTP_LOCKED]: 'errors.OTP_LOCKED',
  [ErrorCodes.ALREADY_REGISTERED]: 'errors.ALREADY_REGISTERED',
  [ErrorCodes.PHONE_REQUIRED]: 'errors.PHONE_REQUIRED',
  [ErrorCodes.KYC_REQUIRED]: 'errors.KYC_REQUIRED',

  [ErrorCodes.ACCOUNT_SUSPENDED]: 'errors.ACCOUNT_SUSPENDED',
  [ErrorCodes.ACCOUNT_BANNED]: 'errors.ACCOUNT_BANNED',

  [ErrorCodes.PROPERTY_UNAVAILABLE]: 'errors.PROPERTY_UNAVAILABLE',
  [ErrorCodes.FAVORITES_LIMIT]: 'errors.FAVORITES_LIMIT',
  [ErrorCodes.SEARCH_UNAVAILABLE]: 'errors.SEARCH_UNAVAILABLE',
  [ErrorCodes.CURSOR_MISMATCH]: 'errors.CURSOR_MISMATCH',
  [ErrorCodes.LOCATION_UNSUPPORTED]: 'errors.LOCATION_UNSUPPORTED',

  [ErrorCodes.BOOKING_SLOT_TAKEN]: 'errors.BOOKING_SLOT_TAKEN',
  [ErrorCodes.BOOKING_CONFLICT]: 'errors.BOOKING_CONFLICT',
  [ErrorCodes.DUPLICATE_APPLICATION]: 'errors.DUPLICATE_APPLICATION',
  [ErrorCodes.TOO_MANY_PENDING]: 'errors.TOO_MANY_PENDING',
  [ErrorCodes.GENDER_POLICY_MISMATCH]: 'errors.GENDER_POLICY_MISMATCH',

  [ErrorCodes.APP_CHECK_FAILED]: 'errors.APP_CHECK_FAILED',

  [ErrorCodes.NETWORK_ERROR]: 'errors.NETWORK_ERROR',
  [ErrorCodes.TIMEOUT]: 'errors.TIMEOUT',
};

/**
 * Get the i18n translation key for a given error code.
 * Falls back to generic error message ('errors.UNKNOWN') for unknown codes.
 */
export function getErrorMessage(code: string): string {
  return errorI18nMap[code] ?? 'errors.UNKNOWN';
}

// ─── Status Code Fallbacks ──────────────────────────────────────────

function getCodeForStatus(status: number): string {
  switch (status) {
    case 401:
      return ErrorCodes.UNAUTHENTICATED;
    case 403:
      return ErrorCodes.FORBIDDEN;
    case 404:
      return ErrorCodes.NOT_FOUND;
    case 429:
      return ErrorCodes.RATE_LIMITED;
    case 503:
      return ErrorCodes.SERVICE_UNAVAILABLE;
    default:
      return ErrorCodes.INTERNAL_ERROR;
  }
}

// ─── ApiError Class ─────────────────────────────────────────────────

export type ApiErrorDetails = Record<string, unknown> | Record<string, unknown>[] | null;

export class ApiError extends Error {
  /** Machine-readable error code — switch on this, never on `message` */
  readonly code: ErrorCode | string;

  /** Optional structured details (e.g. field-level validation errors array or record) */
  readonly details: ApiErrorDetails;

  /** Backend-generated request ID for support / debugging */
  readonly requestId: string | null;

  /** HTTP status code */
  readonly statusCode: number;

  /** Seconds to wait before retrying (from Retry-After header) */
  readonly retryAfterSec: number | null;

  constructor({
    code,
    message,
    details,
    requestId,
    statusCode,
    retryAfterSec,
  }: {
    code: string;
    message: string;
    details?: ApiErrorDetails;
    requestId?: string | null;
    statusCode: number;
    retryAfterSec?: number | null;
  }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details ?? null;
    this.requestId = requestId ?? null;
    this.statusCode = statusCode;
    this.retryAfterSec = retryAfterSec ?? null;
  }

  /** Whether the error is a client error (4xx) */
  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /** Whether the error is a server error (5xx) */
  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /** Whether the user needs to re-authenticate */
  get requiresAuth(): boolean {
    return this.code === ErrorCodes.UNAUTHENTICATED;
  }
}

/**
 * Type guard to check if an unknown error is an ApiError.
 */
export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/**
 * Returns the ApiError code or 'UNKNOWN'.
 */
export function getErrorCode(error: unknown): string {
  if (isApiError(error)) {
    return error.code;
  }
  return 'UNKNOWN';
}

// ─── Factory ────────────────────────────────────────────────────────

interface ErrorResponseBody {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown> | Record<string, unknown>[];
    requestId?: string;
  };
  requestId?: string;
}

/**
 * Create an `ApiError` from a fetch Response.
 *
 * Attempts to parse the standard error envelope from the response body.
 * Falls back to generic values and status-based codes if parsing fails.
 */
export async function createApiError(response: Response): Promise<ApiError> {
  let body: ErrorResponseBody | null = null;

  try {
    body = (await response.json()) as ErrorResponseBody;
  } catch {
    // Body wasn't valid JSON — fall through to defaults
  }

  const error = body?.error;

  let retryAfterSec: number | null = null;
  const retryHeader = response.headers.get('retry-after');
  if (retryHeader) {
    const parsed = parseInt(retryHeader, 10);
    if (!isNaN(parsed)) {
      retryAfterSec = parsed;
    }
  }

  const code = error?.code ?? getCodeForStatus(response.status);
  const message = error?.message ?? (response.statusText ? response.statusText : 'An unexpected error occurred');
  const details = error?.details ?? null;
  const requestId = body?.requestId ?? error?.requestId ?? response.headers.get('x-request-id') ?? null;

  return new ApiError({
    code,
    message,
    details,
    requestId,
    statusCode: response.status,
    retryAfterSec,
  });
}

/**
 * Create a network-level `ApiError` (no response from server).
 */
export function createNetworkError(error: unknown): ApiError {
  const message = error instanceof Error ? error.message : 'Network error';

  return new ApiError({
    code: ErrorCodes.NETWORK_ERROR,
    message,
    statusCode: 0,
  });
}
