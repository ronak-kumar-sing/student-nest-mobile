/**
 * Session store — authentication state and current user.
 *
 * Persisted to MMKV so the user stays signed-in across cold starts.
 * Sensitive tokens live in `expo-secure-store`, not here.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

// ─── Types ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  role: 'student' | 'owner' | null;
}

export interface SessionState {
  /** Currently authenticated user, or `null` if signed out */
  user: User | null;

  /** Active role for navigation layout. Derived from user but settable during onboarding. */
  role: 'student' | 'owner' | null;

  /** Whether the user has a valid session */
  isAuthenticated: boolean;

  /** Whether the user has completed the onboarding flow */
  isOnboarded: boolean;

  /** Set the current user after authentication */
  setUser: (user: User) => void;

  /** Set the active role (during onboarding or role-switch) */
  setRole: (role: 'student' | 'owner') => void;

  /** Mark the onboarding flow as complete */
  setOnboarded: (value: boolean) => void;

  /** Clear all session data (sign out) */
  logout: () => void;
}

// ─── Initial State ──────────────────────────────────────────────────

const initialState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isOnboarded: false,
} as const;

// ─── Store ──────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          role: user.role,
          isAuthenticated: true,
        }),

      setRole: (role) =>
        set((state) => ({
          role,
          user: state.user ? { ...state.user, role } : null,
        })),

      setOnboarded: (value) => set({ isOnboarded: value }),

      logout: () => set({ ...initialState }),
    }),
    {
      name: 'student-nest-session',
      storage: createJSONStorage(() => zustandStorage),
      // Only persist these keys — actions are re-created by Zustand
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
      }),
    },
  ),
);
