import { useEffect } from 'react';
import { getTransportMode } from '@/api/mode';
import { useSessionStore } from '@/stores/session';
import { authApi } from './api';
import { mapUserMeDtoToSessionUser } from './mappers';
import { subscribeToAuthState } from '@/lib/firebase';
import { isApiError, ErrorCodes, getErrorMessage } from '@/api/errors';
import { toast } from '@/components/ui/toast';
import i18n from '@/i18n';

/**
 * Synchronizes session store state with the active auth provider.
 *
 * In mock mode: immediately derives status from persisted MMKV state.
 * In HTTP mode: subscribes to Firebase Auth state changes and verifies profile with backend.
 */
export function useSessionSync(): void {
  useEffect(() => {
    const mode = getTransportMode('auth');

    if (mode === 'mock') {
      const { isAuthenticated, isOnboarded, user } = useSessionStore.getState();
      if (isAuthenticated && user) {
        useSessionStore.getState().setStatus(isOnboarded ? 'signedIn' : 'needsSignup');
      } else {
        useSessionStore.getState().setStatus('signedOut');
      }
      return;
    }

    // HTTP mode: Firebase Auth is the source of truth
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser) {
        useSessionStore.getState().logout();
        useSessionStore.getState().setStatus('signedOut');
        return;
      }

      try {
        const dto = await authApi.getMe();
        try {
          const user = mapUserMeDtoToSessionUser(dto);
          useSessionStore.getState().setUser(user);
          useSessionStore.getState().setOnboarded(true);
          useSessionStore.getState().setStatus('signedIn');
        } catch (mapErr) {
          if (isApiError(mapErr)) {
            if (
              mapErr.code === ErrorCodes.ACCOUNT_SUSPENDED ||
              mapErr.code === ErrorCodes.ACCOUNT_BANNED
            ) {
              toast.error(i18n.t(getErrorMessage(mapErr.code)));
            } else {
              toast.error(mapErr.message);
            }
          }
          await authApi.signOut();
          useSessionStore.getState().setStatus('signedOut');
        }
      } catch (err) {
        if (
          isApiError(err) &&
          (err.code === ErrorCodes.PROFILE_REQUIRED ||
            err.statusCode === 404 ||
            err.code === ErrorCodes.NOT_FOUND)
        ) {
          // The API answers 403 PROFILE_REQUIRED (404 accepted defensively) when the user
          // exists in Firebase but has not completed signup yet -> needsSignup
          useSessionStore.getState().setStatus('needsSignup');
          if (firebaseUser.email) {
            useSessionStore.getState().setPendingEmail(firebaseUser.email);
          }
        } else if (
          isApiError(err) &&
          (err.code === ErrorCodes.ACCOUNT_SUSPENDED || err.code === ErrorCodes.ACCOUNT_BANNED)
        ) {
          toast.error(i18n.t(getErrorMessage(err.code)));
          await authApi.signOut();
          useSessionStore.getState().setStatus('signedOut');
        } else if (
          isApiError(err) &&
          (err.code === ErrorCodes.NETWORK_ERROR ||
            err.code === ErrorCodes.TIMEOUT ||
            err.statusCode === 0)
        ) {
          // Network error: preserve cached session user if available, else mark signedOut
          const current = useSessionStore.getState();
          if (current.user && current.isAuthenticated) {
            current.setStatus('signedIn');
          } else {
            current.setStatus('signedOut');
          }
        } else {
          // Any other error
          const current = useSessionStore.getState();
          if (current.user && current.isAuthenticated) {
            current.setStatus('signedIn');
          } else {
            current.setStatus('signedOut');
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
