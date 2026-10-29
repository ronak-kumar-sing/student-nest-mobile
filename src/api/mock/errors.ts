import { useDevSettingsStore } from '@/stores/dev-settings';
import { ApiError, ErrorCodes } from '@/api/errors';

export function shouldInjectError(): boolean {
  const { forceError, isOffline } = useDevSettingsStore.getState();
  return isOffline || forceError !== null;
}

export function getInjectedError(): ApiError {
  const { forceError, isOffline } = useDevSettingsStore.getState();
  if (isOffline) {
    return new ApiError({
      code: ErrorCodes.NETWORK_ERROR,
      message: 'Network offline (simulated)',
      statusCode: 0,
    });
  }

  const code = forceError ?? ErrorCodes.INTERNAL_ERROR;
  const statusMap: Record<string, number> = {
    [ErrorCodes.VALIDATION_FAILED]: 400,
    [ErrorCodes.UNAUTHENTICATED]: 401,
    [ErrorCodes.FORBIDDEN]: 403,
    [ErrorCodes.NOT_FOUND]: 404,
    [ErrorCodes.INVALID_TRANSITION]: 409,
    [ErrorCodes.BOOKING_SLOT_TAKEN]: 409,
    [ErrorCodes.RATE_LIMITED]: 429,
    [ErrorCodes.INTERNAL_ERROR]: 500,
  };

  return new ApiError({
    code,
    message: `Forced mock error: ${code}`,
    statusCode: statusMap[code] ?? 500,
  });
}

export function createMockError(statusCode: number, code: string, message?: string): ApiError {
  return new ApiError({
    code,
    message: message ?? code,
    statusCode,
  });
}
