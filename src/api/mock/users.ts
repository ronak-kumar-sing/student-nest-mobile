import type { MockUser } from './db';
import type { UserMeDto } from '@/features/auth/types';

/**
 * Builds a full UserMeDto from a MockUser and optional overrides.
 */
export function buildMockUserMeDto(mockUser: MockUser, patch?: Partial<UserMeDto>): UserMeDto {
  const isOwner = mockUser.role === 'owner';

  return {
    id: mockUser.id,
    role: mockUser.role,
    status: 'active',
    email: mockUser.email,
    emailVerified: true,
    phone: mockUser.phone ?? undefined,
    phoneVerified: mockUser.phoneVerified ?? Boolean(mockUser.phone),
    displayName: mockUser.displayName,
    // The OpenAPI output types avatarUrl as `Record<string, never> | null`;
    // the API returns a URL string at runtime.
    avatarUrl: mockUser.avatarUrl ? (mockUser.avatarUrl as unknown as UserMeDto['avatarUrl']) : null,
    gender: mockUser.gender ?? (mockUser.id === 'student-1' ? 'male' : undefined),
    college: mockUser.college ?? (mockUser.id === 'student-1' ? 'IIPS Indore' : undefined),
    city: mockUser.city ?? 'indore',
    bio: mockUser.bio,
    kycStatus: isOwner ? (mockUser.id === 'owner-1' ? 'approved' : 'none') : undefined,
    ownerProfile: isOwner
      ? {
          kycStatus: mockUser.id === 'owner-1' ? 'approved' : 'none',
          businessName: mockUser.id === 'owner-1' ? 'Kumar Residency' : undefined,
          listedPropertyCount: mockUser.id === 'owner-1' ? 2 : 0,
          responseRate: mockUser.id === 'owner-1' ? 0.95 : undefined,
          avgResponseMins: mockUser.id === 'owner-1' ? 20 : undefined,
        }
      : undefined,
    claims: {
      role: mockUser.role,
      status: 'active',
      kycStatus: isOwner ? (mockUser.id === 'owner-1' ? 'approved' : undefined) : undefined,
    },
    notificationPrefs: {
      channels: { email: true, sms: false, push: true },
      types: {},
    },
    consents: {
      termsVersion: '2026-01',
      acceptedAt: new Date().toISOString(),
      marketingOptIn: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...patch,
  };
}
