import { ApiError, ErrorCodes } from '@/api/errors';
import type { UserMeDto } from './types';
import type { User } from '@/stores/session';

/**
 * Maps a backend UserMeDto to the frontend session User.
 *
 * Enforces business rules:
 * - Admin users cannot use this mobile client and are treated as forbidden/signed out.
 * - Suspended or banned accounts throw corresponding ApiErrors so the client can
 *   show the localized message and sign out.
 */
export function mapUserMeDtoToSessionUser(dto: UserMeDto): User {
  if (dto.status === 'suspended') {
    throw new ApiError({
      code: ErrorCodes.ACCOUNT_SUSPENDED,
      message: 'Account is suspended',
      statusCode: 403,
    });
  }

  if (dto.status === 'banned') {
    throw new ApiError({
      code: ErrorCodes.ACCOUNT_BANNED,
      message: 'Account is banned',
      statusCode: 403,
    });
  }

  if (dto.role === 'admin') {
    throw new ApiError({
      code: ErrorCodes.FORBIDDEN,
      message: 'Admins use the web console',
      statusCode: 403,
    });
  }

  const avatarUrl = typeof dto.avatarUrl === 'string' ? dto.avatarUrl : null;

  return {
    id: dto.id,
    email: dto.email ?? '',
    displayName: dto.displayName ?? null,
    avatarUrl,
    phone: dto.phone ?? null,
    role: dto.role,
  };
}
