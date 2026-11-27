import { mockAuthApi } from '@/features/auth/api';
import { getDB, resetDB } from '@/api/mock/db';
import { useDevSettingsStore } from '@/stores/dev-settings';
import { useSessionStore } from '@/stores/session';
import { ApiError, ErrorCodes } from '@/api/errors';

describe('mockAuthApi', () => {
  beforeEach(() => {
    resetDB();
    useDevSettingsStore.getState().resetAll();
    useSessionStore.getState().logout();
  });

  it('sendEmailOtp returns 202 with expiresInSec and resendAfterSec', async () => {
    const res = await mockAuthApi.sendEmailOtp('test@example.com');

    expect(res).toEqual({
      expiresInSec: 300,
      resendAfterSec: 30,
    });
  });

  it('verifyEmailOtp with code 000000 succeeds and reports isNewUser false for existing user', async () => {
    // rahul.sharma@example.com is in initial mock DB
    const res = await mockAuthApi.verifyEmailOtp('rahul.sharma@example.com', '000000');

    expect(res).toEqual({ isNewUser: false });
    expect(useSessionStore.getState().pendingEmail).toBe('rahul.sharma@example.com');
  });

  it('verifyEmailOtp with code 000000 succeeds and reports isNewUser true for unknown email', async () => {
    const res = await mockAuthApi.verifyEmailOtp('new.student@test.studentnest.app', '000000');

    expect(res).toEqual({ isNewUser: true });
    expect(useSessionStore.getState().pendingEmail).toBe('new.student@test.studentnest.app');
  });

  it('verifyEmailOtp with any other code throws ApiError with OTP_INVALID', async () => {
    await expect(
      mockAuthApi.verifyEmailOtp('rahul.sharma@example.com', '123456'),
    ).rejects.toThrow(ApiError);

    try {
      await mockAuthApi.verifyEmailOtp('rahul.sharma@example.com', '123456');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(ErrorCodes.OTP_INVALID);
      expect(apiErr.statusCode).toBe(400);
    }
  });

  it('signup adds a new user to mock db and returns SignupResponseDto', async () => {
    useSessionStore.getState().setPendingEmail('neha.verma@example.com');

    const res = await mockAuthApi.signup({
      role: 'student',
      displayName: 'Neha Verma',
      acceptedTermsVersion: '2026-01',
      marketingOptIn: false,
    });

    expect(res.refreshToken).toBe(true);
    expect(res.user.displayName).toBe('Neha Verma');
    expect(res.user.role).toBe('student');
    expect(res.user.email).toBe('neha.verma@example.com');

    const db = getDB();
    const found = db.users.find((u) => u.email === 'neha.verma@example.com');
    expect(found).toBeDefined();
    expect(found?.displayName).toBe('Neha Verma');
  });

  it('signup throws ALREADY_REGISTERED if existing user tries to sign up with different role', async () => {
    useSessionStore.getState().setPendingEmail('rahul.sharma@example.com'); // rahul is student in mock DB

    await expect(
      mockAuthApi.signup({
        role: 'owner', // different role
        displayName: 'Rahul Sharma',
        acceptedTermsVersion: '2026-01',
      }),
    ).rejects.toThrow(ApiError);

    try {
      await mockAuthApi.signup({
        role: 'owner',
        displayName: 'Rahul Sharma',
        acceptedTermsVersion: '2026-01',
      });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(ErrorCodes.ALREADY_REGISTERED);
      expect(apiErr.statusCode).toBe(409);
    }
  });

  it('updateProfile updates displayName and extra fields on current mock user', async () => {
    useSessionStore.getState().setUser({
      id: 'student-1',
      email: 'rahul.sharma@example.com',
      displayName: 'Rahul Sharma',
      avatarUrl: null,
      phone: '+919876543210',
      role: 'student',
    });

    const updated = await mockAuthApi.updateProfile({
      displayName: 'Rahul S. Updated',
      gender: 'male',
      college: 'IET-DAVV',
      city: 'indore',
    });

    expect(updated.displayName).toBe('Rahul S. Updated');
    expect(updated.gender).toBe('male');
    expect(updated.college).toBe('IET-DAVV');
    expect(updated.city).toBe('indore');
  });

  it('getMe returns current user or throws NOT_FOUND / UNAUTHENTICATED', async () => {
    // When signed out and no pending email
    await expect(mockAuthApi.getMe()).rejects.toThrow(ApiError);

    // When signed in as student-1
    useSessionStore.getState().setUser({
      id: 'student-1',
      email: 'rahul.sharma@example.com',
      displayName: 'Rahul Sharma',
      avatarUrl: null,
      phone: '+919876543210',
      role: 'student',
    });

    const me = await mockAuthApi.getMe();
    expect(me.id).toBe('student-1');
    expect(me.displayName).toBe('Rahul Sharma');
    expect(me.role).toBe('student');
  });
});
