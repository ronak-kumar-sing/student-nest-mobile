import { mapUserMeDtoToSessionUser } from '@/features/auth/mappers';
import type { UserMeDto } from '@/features/auth/types';
import { ApiError, ErrorCodes } from '@/api/errors';

describe('mapUserMeDtoToSessionUser', () => {
  const baseUserMeDto: UserMeDto = {
    id: 'user-123',
    role: 'student',
    status: 'active',
    email: 'student@example.com',
    emailVerified: true,
    phone: '+919876543210',
    phoneVerified: true,
    displayName: 'Rahul Sharma',
    avatarUrl: null,
    claims: {
      role: 'student',
      status: 'active',
    },
    notificationPrefs: {
      channels: { email: true, sms: false, push: true },
      types: {},
    },
    consents: {
      termsVersion: '2026-01',
      acceptedAt: '2026-10-29T10:00:00.000Z',
      marketingOptIn: false,
    },
    createdAt: '2026-10-29T10:00:00.000Z',
    updatedAt: '2026-10-29T10:00:00.000Z',
  };

  it('maps an active student UserMeDto to session User correctly', () => {
    const user = mapUserMeDtoToSessionUser(baseUserMeDto);

    expect(user).toEqual({
      id: 'user-123',
      email: 'student@example.com',
      displayName: 'Rahul Sharma',
      avatarUrl: null,
      phone: '+919876543210',
      role: 'student',
    });
  });

  it('maps an active owner UserMeDto to session User correctly', () => {
    const ownerDto: UserMeDto = {
      ...baseUserMeDto,
      id: 'owner-456',
      role: 'owner',
      displayName: 'Amit Kumar',
      claims: {
        role: 'owner',
        status: 'active',
        kycStatus: 'approved',
      },
    };

    const user = mapUserMeDtoToSessionUser(ownerDto);

    expect(user).toEqual({
      id: 'owner-456',
      email: 'student@example.com',
      displayName: 'Amit Kumar',
      avatarUrl: null,
      phone: '+919876543210',
      role: 'owner',
    });
  });

  it('preserves avatarUrl when provided as string and converts object to null', () => {
    const userWithStringAvatar = mapUserMeDtoToSessionUser({
      ...baseUserMeDto,
      avatarUrl: 'https://example.com/avatar.jpg' as any,
    });
    expect(userWithStringAvatar.avatarUrl).toBe('https://example.com/avatar.jpg');

    const userWithObjectAvatar = mapUserMeDtoToSessionUser({
      ...baseUserMeDto,
      avatarUrl: {} as any,
    });
    expect(userWithObjectAvatar.avatarUrl).toBeNull();
  });

  it('handles optional / missing fields safely', () => {
    const minimalDto: UserMeDto = {
      id: 'min-1',
      role: 'student',
      status: 'active',
      emailVerified: false,
      phoneVerified: false,
      claims: {},
      notificationPrefs: {
        channels: { email: true, sms: false, push: false },
        types: {},
      },
    };

    const user = mapUserMeDtoToSessionUser(minimalDto);

    expect(user).toEqual({
      id: 'min-1',
      email: '',
      displayName: null,
      avatarUrl: null,
      phone: null,
      role: 'student',
    });
  });

  it('throws an ApiError when role is admin with message "Admins use the web console"', () => {
    const adminDto: UserMeDto = {
      ...baseUserMeDto,
      role: 'admin',
    };

    expect(() => mapUserMeDtoToSessionUser(adminDto)).toThrow(ApiError);
    try {
      mapUserMeDtoToSessionUser(adminDto);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(ErrorCodes.FORBIDDEN);
      expect(apiErr.message).toBe('Admins use the web console');
      expect(apiErr.statusCode).toBe(403);
    }
  });

  it('throws an ApiError with ACCOUNT_SUSPENDED when status is suspended', () => {
    const suspendedDto: UserMeDto = {
      ...baseUserMeDto,
      status: 'suspended',
    };

    expect(() => mapUserMeDtoToSessionUser(suspendedDto)).toThrow(ApiError);
    try {
      mapUserMeDtoToSessionUser(suspendedDto);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(ErrorCodes.ACCOUNT_SUSPENDED);
      expect(apiErr.statusCode).toBe(403);
    }
  });

  it('throws an ApiError with ACCOUNT_BANNED when status is banned', () => {
    const bannedDto: UserMeDto = {
      ...baseUserMeDto,
      status: 'banned',
    };

    expect(() => mapUserMeDtoToSessionUser(bannedDto)).toThrow(ApiError);
    try {
      mapUserMeDtoToSessionUser(bannedDto);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(ErrorCodes.ACCOUNT_BANNED);
      expect(apiErr.statusCode).toBe(403);
    }
  });
});
