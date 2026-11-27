import { resolveRoute, SHARED_ROUTES } from '@/features/auth/routing';

describe('resolveRoute', () => {
  describe('when status is initializing', () => {
    it('returns null regardless of segments and role', () => {
      expect(resolveRoute('initializing', null, ['(auth)', 'login'])).toBeNull();
      expect(resolveRoute('initializing', 'student', ['(student)', '(tabs)', 'explore'])).toBeNull();
      expect(resolveRoute('initializing', 'owner', ['index'])).toBeNull();
      expect(resolveRoute('initializing', null, [])).toBeNull();
    });
  });

  describe('when status is signedOut', () => {
    it('returns null when user is inside the (auth) group', () => {
      expect(resolveRoute('signedOut', null, ['(auth)'])).toBeNull();
      expect(resolveRoute('signedOut', null, ['(auth)', 'login'])).toBeNull();
      expect(resolveRoute('signedOut', null, ['(auth)', 'signup'])).toBeNull();
      expect(resolveRoute('signedOut', null, ['(auth)', 'otp'])).toBeNull();
    });

    it('returns null when accessing the dev menu', () => {
      expect(resolveRoute('signedOut', null, ['dev'])).toBeNull();
    });

    it('redirects to /(auth) when on any protected route or index', () => {
      expect(resolveRoute('signedOut', null, ['index'])).toBe('/(auth)');
      expect(resolveRoute('signedOut', null, ['(student)', '(tabs)', 'explore'])).toBe('/(auth)');
      expect(resolveRoute('signedOut', null, ['(owner)', '(tabs)', 'dashboard'])).toBe('/(auth)');
      expect(resolveRoute('signedOut', null, [])).toBe('/(auth)');
    });
  });

  describe('when status is needsSignup', () => {
    it('returns null for allowed signup routes: role, profile-setup, terms', () => {
      expect(resolveRoute('needsSignup', 'student', ['(auth)', 'role'])).toBeNull();
      expect(resolveRoute('needsSignup', 'student', ['(auth)', 'profile-setup'])).toBeNull();
      expect(resolveRoute('needsSignup', 'student', ['(auth)', 'terms'])).toBeNull();
    });

    it('returns null when accessing dev menu', () => {
      expect(resolveRoute('needsSignup', null, ['dev'])).toBeNull();
    });

    it('redirects to /(auth)/role when on entry auth screens or unallowed screens', () => {
      expect(resolveRoute('needsSignup', null, ['(auth)', 'login'])).toBe('/(auth)/role');
      expect(resolveRoute('needsSignup', null, ['(auth)', 'otp'])).toBe('/(auth)/role');
      expect(resolveRoute('needsSignup', null, ['(auth)'])).toBe('/(auth)/role');
      expect(resolveRoute('needsSignup', null, ['(student)', '(tabs)', 'explore'])).toBe('/(auth)/role');
      expect(resolveRoute('needsSignup', null, ['index'])).toBe('/(auth)/role');
    });
  });

  describe('when status is signedIn', () => {
    it('redirects from (auth) routes to role destination', () => {
      expect(resolveRoute('signedIn', 'student', ['(auth)'])).toBe('/(student)/(tabs)/explore');
      expect(resolveRoute('signedIn', 'student', ['(auth)', 'login'])).toBe('/(student)/(tabs)/explore');
      expect(resolveRoute('signedIn', 'owner', ['(auth)'])).toBe('/(owner)/(tabs)/dashboard');
      expect(resolveRoute('signedIn', 'owner', ['(auth)', 'otp'])).toBe('/(owner)/(tabs)/dashboard');
    });

    it('redirects from root index to role destination', () => {
      expect(resolveRoute('signedIn', 'student', ['index'])).toBe('/(student)/(tabs)/explore');
      expect(resolveRoute('signedIn', 'owner', ['index'])).toBe('/(owner)/(tabs)/dashboard');
      expect(resolveRoute('signedIn', 'student', [])).toBe('/(student)/(tabs)/explore');
    });

    it('redirects on persona role mismatch', () => {
      expect(resolveRoute('signedIn', 'owner', ['(student)', '(tabs)', 'explore'])).toBe(
        '/(owner)/(tabs)/dashboard',
      );
      expect(resolveRoute('signedIn', 'student', ['(owner)', '(tabs)', 'dashboard'])).toBe(
        '/(student)/(tabs)/explore',
      );
    });

    it('returns null when user is on their correct role tabs', () => {
      expect(resolveRoute('signedIn', 'student', ['(student)', '(tabs)', 'explore'])).toBeNull();
      expect(resolveRoute('signedIn', 'owner', ['(owner)', '(tabs)', 'dashboard'])).toBeNull();
    });

    it('does not block shared routes for signed-in users', () => {
      for (const route of SHARED_ROUTES) {
        expect(resolveRoute('signedIn', 'student', [route, '123'])).toBeNull();
        expect(resolveRoute('signedIn', 'owner', [route, '456'])).toBeNull();
      }
    });
  });
});
