/**
 * API error handling.
 *
 * All backend errors follow the envelope:
 * ```json
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable message (don't switch on this)",
 *     "details": { ... },
 *     "requestId": "uuid"
 *   }
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

  // Auth
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_LOCKED: 'OTP_LOCKED',

  // Account
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',

  // Booking
  BOOKING_SLOT_TAKEN: 'BOOKING_SLOT_TAKEN',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',

  // Network (client-side only)
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
  [ErrorCodes.ACCOUNT_SUSPENDED]: 'errors.ACCOUNT_SUSPENDED',
  [ErrorCodes.ACCOUNT_BANNED]: 'errors.ACCOUNT_SUSPENDED',
  [ErrorCodes.OTP_INVALID]: 'errors.OTP_INVALID',
  [ErrorCodes.OTP_EXPIRED]: 'errors.OTP_EXPIRED',
  [ErrorCodes.OTP_LOCKED]: 'errors.OTP_LOCKED',
  [ErrorCodes.BOOKING_SLOT_TAKEN]: 'errors.BOOKING_SLOT_TAKEN',
  [ErrorCodes.BOOKING_CONFLICT]: 'errors.BOOKING_SLOT_TAKEN',
  [ErrorCodes.NETWORK_ERROR]: 'errors.NETWORK_ERROR',
  [ErrorCodes.TIMEOUT]: 'errors.NETWORK_ERROR',
  [ErrorCodes.INTERNAL_ERROR]: 'errors.error',
};

/**
 * Get the i18n translation key for a given error code.
 * Falls back to a generic error message for unknown codes.
 */
export function getErrorMessage(code: string): string {
  return errorI18nMap[code] ?? 'common.error';
}

// ─── ApiError Class ─────────────────────────────────────────────────

export class ApiError extends Error {
  /** Machine-readable error code — switch on this, never on `message` */
  readonly code: ErrorCode | string;

  /** Optional structured details (e.g. field-level validation errors) */
  readonly details: Record<string, unknown> | null;

  /** Backend-generated request ID for support / debugging */
  readonly requestId: string | null;

  /** HTTP status code */
  readonly statusCode: number;

  constructor({
    code,
    message,
    details,
    requestId,
    statusCode,
  }: {
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
    requestId?: string | null;
    statusCode: number;
  }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details ?? null;
    this.requestId = requestId ?? null;
    this.statusCode = statusCode;
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

// ─── Factory ────────────────────────────────────────────────────────

interface ErrorResponseBody {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
    requestId?: string;
  };
}

/**
 * Create an `ApiError` from a fetch Response.
 *
 * Attempts to parse the standard error envelope from the response body.
 * Falls back to generic values if parsing fails.
 */
export async function createApiError(response: Response): Promise<ApiError> {
  let body: ErrorResponseBody | null = null;

  try {
    body = (await response.json()) as ErrorResponseBody;
  } catch {
    // Body wasn't valid JSON — fall through to defaults
  }

  const error = body?.error;

  return new ApiError({
    code: error?.code ?? ErrorCodes.INTERNAL_ERROR,
    message: error?.message ?? response.statusText ?? 'An unexpected error occurred',
    details: error?.details ?? null,
    requestId: error?.requestId ?? null,
    statusCode: response.status,
  });
}

/**
 * Create a network-level `ApiError` (no response from server).
 */
export function createNetworkError(error: unknown): ApiError {
  const message =
    error instanceof Error ? error.message : 'Network error';

  return new ApiError({
    code: ErrorCodes.NETWORK_ERROR,
    message,
    statusCode: 0,
  });
}
