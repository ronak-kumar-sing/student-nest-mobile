import type { AuthStatus } from '@/stores/session';

export const SHARED_ROUTES = ['property', 'booking', 'chat', 'tour', 'dev', 'profile'] as const;

export function isSharedRoute(segment: string | undefined): boolean {
  if (!segment) return false;
  return (SHARED_ROUTES as readonly string[]).includes(segment);
}

/**
 * Resolves destination route based on session state and current route segments.
 * Returns null if the user is already on an allowed route and no redirection is needed.
 */
export function resolveRoute(
  status: AuthStatus,
  role: 'student' | 'owner' | null,
  segments: string[],
): string | null {
  // 1. While initializing, do not navigate (allow splash / startup animation)
  if (status === 'initializing') {
    return null;
  }

  const firstSegment = segments[0];

  // 2. Shared routes (property, booking, chat, tour, dev)
  if (isSharedRoute(firstSegment)) {
    // Dev menu is always accessible; other shared routes require signedIn
    if (status === 'signedIn' || firstSegment === 'dev') {
      return null;
    }
  }

  // 3. Signed out
  if (status === 'signedOut') {
    // In auth group: allowed
    if (firstSegment === '(auth)') {
      return null;
    }
    // Dev menu is accessible
    if (firstSegment === 'dev') {
      return null;
    }
    // Anywhere else, redirect to auth
    return '/(auth)';
  }

  // 4. Needs signup
  if (status === 'needsSignup') {
    if (firstSegment === '(auth)') {
      const secondSegment = segments[1];
      // Allowed signup routes: role, profile-setup, terms
      if (
        secondSegment === 'role' ||
        secondSegment === 'profile-setup' ||
        secondSegment === 'terms'
      ) {
        return null;
      }
      return '/(auth)/role';
    }
    if (firstSegment === 'dev') {
      return null;
    }
    return '/(auth)/role';
  }

  // 5. Signed in
  if (status === 'signedIn') {
    const targetTabRoot =
      role === 'owner' ? '/(owner)/(tabs)/dashboard' : '/(student)/(tabs)/explore';

    // Never stay in (auth) or root index once signed in
    if (!firstSegment || firstSegment === '(auth)' || firstSegment === 'index') {
      return targetTabRoot;
    }

    // Role mismatch check: student in owner tabs or owner in student tabs
    if (role === 'owner' && firstSegment === '(student)') {
      return '/(owner)/(tabs)/dashboard';
    }
    if (role === 'student' && firstSegment === '(owner)') {
      return '/(student)/(tabs)/explore';
    }

    // Already on appropriate tab or shared screen
    return null;
  }

  return null;
}
