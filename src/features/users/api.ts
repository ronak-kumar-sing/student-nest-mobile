import { http } from '@/api/http';
import { bindTransport } from '@/api/transport';
import { ApiError, ErrorCodes } from '@/api/errors';
import { getDB } from '@/api/mock/db';
import { buildMockUserMeDto } from '@/api/mock/users';
import { simulateLatency } from '@/api/mock/latency';
import { shouldInjectError, getInjectedError } from '@/api/mock/errors';
import { getCurrentIdToken } from '@/lib/firebase';
import { useSessionStore } from '@/stores/session';
import type {
  UsersApi,
  UserMeDto,
  UpdateProfileDto,
  BecomeOwnerDto,
  BecomeOwnerResponseDto,
} from './types';

// ─── HTTP Implementation ───────────────────────────────────────────

export const httpUsersApi: UsersApi = {
  async getMe(signal?: AbortSignal): Promise<UserMeDto> {
    return http.get<UserMeDto>('/v1/users/me', { auth: 'required', signal });
  },

  async updateMe(patch: UpdateProfileDto): Promise<UserMeDto> {
    return http.patch<UserMeDto>('/v1/users/me', patch, { auth: 'required' });
  },

  async becomeOwner(input?: BecomeOwnerDto): Promise<BecomeOwnerResponseDto> {
    const res = await http.post<BecomeOwnerResponseDto>(
      '/v1/users/me/become-owner',
      input ?? {},
      { auth: 'required' },
    );

    // Refresh the ID token so custom claims (role=owner) take effect
    await getCurrentIdToken(true);

    return res;
  },
};

// ─── Mock Implementation ────────────────────────────────────────────

export const mockUsersApi: UsersApi = {
  async getMe(_signal?: AbortSignal): Promise<UserMeDto> {
    if (shouldInjectError()) throw getInjectedError();
    await simulateLatency();

    const db = getDB();
    const currentSessionUser = useSessionStore.getState().user;
    const pendingEmail = useSessionStore.getState().pendingEmail;

    let target = db.users.find(
      (u) =>
        (currentSessionUser && u.id === currentSessionUser.id) ||
        (pendingEmail && u.email.toLowerCase() === pendingEmail.toLowerCase()),
    );

    if (!target) {
      target = db.users[0];
    }

    if (!target) {
      throw new ApiError({
        code: ErrorCodes.NOT_FOUND,
        message: 'User profile not found',
        statusCode: 404,
      });
    }

    return buildMockUserMeDto(target);
  },

  async updateMe(patch: UpdateProfileDto): Promise<UserMeDto> {
    if (shouldInjectError()) throw getInjectedError();
    await simulateLatency();

    const db = getDB();
    const currentSessionUser = useSessionStore.getState().user;
    const pendingEmail = useSessionStore.getState().pendingEmail;

    let target = db.users.find(
      (u) =>
        (currentSessionUser && u.id === currentSessionUser.id) ||
        (pendingEmail && u.email.toLowerCase() === pendingEmail.toLowerCase()),
    );

    if (!target) {
      target = db.users[0];
    }

    if (!target) {
      throw new ApiError({
        code: ErrorCodes.NOT_FOUND,
        message: 'User profile not found',
        statusCode: 404,
      });
    }

    if (patch.displayName) target.displayName = patch.displayName;
    if (patch.gender) target.gender = patch.gender;
    if (patch.college !== undefined) target.college = patch.college;
    if (patch.city !== undefined) target.city = patch.city;
    if (patch.bio !== undefined) target.bio = patch.bio;

    return buildMockUserMeDto(target, patch);
  },

  async becomeOwner(input?: BecomeOwnerDto): Promise<BecomeOwnerResponseDto> {
    if (shouldInjectError()) throw getInjectedError();
    await simulateLatency();

    const db = getDB();
    const currentSessionUser = useSessionStore.getState().user;

    let target = db.users.find((u) => currentSessionUser && u.id === currentSessionUser.id);
    if (!target) {
      target = db.users[0];
    }

    if (!target) {
      throw new ApiError({
        code: ErrorCodes.NOT_FOUND,
        message: 'User profile not found',
        statusCode: 404,
      });
    }

    // Check for pending or approved bookings blocking become-owner transition
    const hasActiveBooking = db.bookings.some(
      (b) => b.studentId === target.id && (b.status === 'pending' || b.status === 'approved'),
    );

    if (hasActiveBooking) {
      throw new ApiError({
        code: ErrorCodes.ACTIVE_BOOKINGS_EXIST,
        message: 'Active bookings exist. Cannot become an owner until bookings are resolved.',
        statusCode: 409,
      });
    }

    target.role = 'owner';

    const userDto = buildMockUserMeDto(target, {
      role: 'owner',
      kycStatus: 'none',
      ownerProfile: {
        kycStatus: 'none',
        businessName: input?.businessName,
        listedPropertyCount: 0,
      },
      claims: {
        role: 'owner',
        status: 'active',
        kycStatus: undefined,
      },
    });

    return {
      user: userDto,
      refreshToken: true,
    };
  },
};

// ─── Transport Binding ──────────────────────────────────────────────

export const usersApi: UsersApi = bindTransport('users', {
  mock: mockUsersApi,
  http: httpUsersApi,
});
