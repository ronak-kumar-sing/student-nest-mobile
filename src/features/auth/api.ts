import { http } from '@/api/http';
import { bindTransport } from '@/api/transport';
import { ApiError, ErrorCodes } from '@/api/errors';
import { getDB, type MockUser } from '@/api/mock/db';
import { buildMockUserMeDto } from '@/api/mock/users';
import { simulateLatency } from '@/api/mock/latency';
import { shouldInjectError, getInjectedError } from '@/api/mock/errors';
import { queryClient } from '@/api/query-client';
import {
  signInWithFirebaseCustomToken,
  signOutFirebase,
  getCurrentIdToken,
} from '@/lib/firebase';
import { useSessionStore } from '@/stores/session';
import type {
  AuthApi,
  SendOtpResponseDto,
  VerifyOtpResponseDto,
  SignupInput,
  SignupResponseDto,
  UpdateProfileDto,
  UserMeDto,
  DemoConfigDto,
  DemoPersona,
  DemoSignInResponseDto,
} from './types';

// ─── HTTP Implementation ───────────────────────────────────────────

export const httpAuthApi: AuthApi = {
  async sendEmailOtp(email: string): Promise<SendOtpResponseDto> {
    return http.post<SendOtpResponseDto>(
      '/v1/auth/otp/email/send',
      { email },
      { auth: 'none' },
    );
  },

  async verifyEmailOtp(email: string, code: string): Promise<{ isNewUser: boolean }> {
    const res = await http.post<VerifyOtpResponseDto>(
      '/v1/auth/otp/email/verify',
      { email, code },
      { auth: 'none' },
    );

    // Sign in using the custom Firebase token returned by the backend
    // Never log the custom token
    await signInWithFirebaseCustomToken(res.customToken);

    return { isNewUser: res.isNewUser };
  },

  async signup(input: SignupInput): Promise<SignupResponseDto> {
    const res = await http.post<SignupResponseDto>(
      '/v1/auth/signup',
      input,
      { auth: 'required' },
    );

    // Force-refresh the ID token so custom claims (role, status) are updated
    await getCurrentIdToken(true);

    return res;
  },

  async updateProfile(patch: UpdateProfileDto): Promise<UserMeDto> {
    return http.patch<UserMeDto>('/v1/users/me', patch, { auth: 'required' });
  },

  async getMe(signal?: AbortSignal): Promise<UserMeDto> {
    return http.get<UserMeDto>('/v1/users/me', { auth: 'required', signal });
  },

  async signOut(): Promise<void> {
    await signOutFirebase();
    queryClient.clear();
    useSessionStore.getState().logout();
  },

  async getDemoConfig(signal?: AbortSignal): Promise<DemoConfigDto> {
    return http.get<DemoConfigDto>('/v1/auth/demo', { auth: 'none', signal });
  },

  async demoSignIn(persona: DemoPersona): Promise<DemoSignInResponseDto> {
    const res = await http.post<DemoSignInResponseDto>(
      '/v1/auth/demo/sign-in',
      { persona },
      { auth: 'none' },
    );

    // Sign in using the custom Firebase token returned by the backend
    // Never log the custom token
    await signInWithFirebaseCustomToken(res.customToken);
    await getCurrentIdToken(true);

    return res;
  },
};

// ─── Mock Implementation ────────────────────────────────────────────

export const mockAuthApi: AuthApi = {
  async sendEmailOtp(_email: string): Promise<SendOtpResponseDto> {
    if (shouldInjectError()) throw getInjectedError();
    await simulateLatency();

    return {
      expiresInSec: 300,
      resendAfterSec: 30,
    };
  },

  async verifyEmailOtp(email: string, code: string): Promise<{ isNewUser: boolean }> {
    if (shouldInjectError()) throw getInjectedError();
    await simulateLatency();

    if (code !== '000000') {
      throw new ApiError({
        code: ErrorCodes.OTP_INVALID,
        message: 'Invalid verification code',
        statusCode: 400,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    useSessionStore.getState().setPendingEmail(normalizedEmail);

    const db = getDB();
    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    return {
      isNewUser: !existing,
    };
  },

  async signup(input: SignupInput): Promise<SignupResponseDto> {
    if (shouldInjectError()) throw getInjectedError();
    await simulateLatency();

    const pendingEmail =
      useSessionStore.getState().pendingEmail ??
      `${input.displayName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const normalizedEmail = pendingEmail.trim().toLowerCase();

    const db = getDB();
    const existingIndex = db.users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    let user: MockUser;
    if (existingIndex >= 0 && db.users[existingIndex]) {
      const existing = db.users[existingIndex];
      if (existing.role !== input.role) {
        throw new ApiError({
          code: ErrorCodes.ALREADY_REGISTERED,
          message: 'An account already exists with a different role',
          statusCode: 409,
        });
      }
      existing.displayName = input.displayName;
      user = existing;
    } else {
      user = {
        id: `mock-user-${Date.now()}`,
        email: normalizedEmail,
        displayName: input.displayName,
        role: input.role,
        avatarUrl: null,
        phone: null,
        isVerified: false,
      };
      db.users.push(user);
    }

    const userMeDto = buildMockUserMeDto(user, {
      consents: {
        termsVersion: input.acceptedTermsVersion,
        acceptedAt: new Date().toISOString(),
        marketingOptIn: Boolean(input.marketingOptIn),
      },
    });

    return {
      user: userMeDto,
      refreshToken: true,
    };
  },

  async updateProfile(patch: UpdateProfileDto): Promise<UserMeDto> {
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

    return buildMockUserMeDto(target, {
      bio: patch.bio,
      gender: patch.gender,
      college: patch.college,
      city: patch.city,
    });
  },

  async getMe(_signal?: AbortSignal): Promise<UserMeDto> {
    if (shouldInjectError()) throw getInjectedError();
    await simulateLatency();

    const db = getDB();
    const sessionState = useSessionStore.getState();
    const currentSessionUser = sessionState.user;
    const pendingEmail = sessionState.pendingEmail;

    const target = db.users.find(
      (u) =>
        (currentSessionUser && u.id === currentSessionUser.id) ||
        (pendingEmail && u.email.toLowerCase() === pendingEmail.toLowerCase()),
    );

    if (!target) {
      if (currentSessionUser || pendingEmail) {
        throw new ApiError({
          code: ErrorCodes.NOT_FOUND,
          message: 'User profile not found',
          statusCode: 404,
        });
      }
      throw new ApiError({
        code: ErrorCodes.UNAUTHENTICATED,
        message: 'Unauthenticated',
        statusCode: 401,
      });
    }

    return buildMockUserMeDto(target);
  },

  async signOut(): Promise<void> {
    queryClient.clear();
    useSessionStore.getState().logout();
  },

  async getDemoConfig(_signal?: AbortSignal): Promise<DemoConfigDto> {
    return {
      enabled: false,
      personas: [],
    };
  },

  async demoSignIn(_persona: DemoPersona): Promise<DemoSignInResponseDto> {
    throw new ApiError({
      code: ErrorCodes.NOT_FOUND,
      message: 'Demo mode is not available in mock mode',
      statusCode: 404,
    });
  },
};

// ─── Transport Binding ──────────────────────────────────────────────

export const authApi: AuthApi = bindTransport('auth', {
  mock: mockAuthApi,
  http: httpAuthApi,
});
