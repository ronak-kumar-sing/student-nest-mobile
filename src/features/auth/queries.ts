import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { authApi } from './api';
import { queryClient } from '@/api/query-client';
import { useSessionStore } from '@/stores/session';
import { getTransportMode } from '@/api/mode';
import type {
  UserMeDto,
  SendOtpResponseDto,
  SignupInput,
  SignupResponseDto,
  UpdateProfileDto,
  DemoConfigDto,
  DemoPersona,
  DemoSignInResponseDto,
} from './types';

// ─── Query Keys Factory ─────────────────────────────────────────────

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  demo: () => [...authKeys.all, 'demo'] as const,
};

// ─── Queries ────────────────────────────────────────────────────────

/**
 * Hook to fetch current user's profile and verification state.
 * Enabled only when user is authenticated.
 */
export function useMe(): UseQueryResult<UserMeDto, Error> {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => authApi.getMe(signal),
    enabled: isAuthenticated,
  });
}

/**
 * Hook to fetch demo sign-in configuration.
 * Enabled only when auth transport is in HTTP mode.
 * Catches errors and treats them as "demo off".
 */
export function useDemoConfig(): UseQueryResult<DemoConfigDto, Error> {
  const isHttp = getTransportMode('auth') === 'http';

  return useQuery({
    queryKey: authKeys.demo(),
    queryFn: async ({ signal }) => {
      try {
        return await authApi.getDemoConfig(signal);
      } catch {
        return { enabled: false, personas: [] };
      }
    },
    enabled: isHttp,
    retry: false,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────

/**
 * Mutation to send a 6-digit email OTP.
 */
export function useSendEmailOtp() {
  return useMutation<SendOtpResponseDto, Error, string>({
    mutationFn: (email: string) => authApi.sendEmailOtp(email),
  });
}

/**
 * Mutation to verify email OTP and obtain a Firebase custom token.
 */
export function useVerifyEmailOtp() {
  return useMutation<{ isNewUser: boolean }, Error, { email: string; code: string }>({
    mutationFn: ({ email, code }) => authApi.verifyEmailOtp(email, code),
  });
}

/**
 * Mutation to create user profile after initial authentication.
 */
export function useSignup() {
  return useMutation<SignupResponseDto, Error, SignupInput>({
    mutationFn: (input: SignupInput) => authApi.signup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

/**
 * Mutation to update profile fields (bio, gender, college, city, etc.).
 */
export function useUpdateProfile() {
  return useMutation<UserMeDto, Error, UpdateProfileDto>({
    mutationFn: (patch: UpdateProfileDto) => authApi.updateProfile(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

/**
 * Mutation to sign out of the active session.
 */
export function useSignOut() {
  return useMutation<void, Error, void>({
    mutationFn: () => authApi.signOut(),
  });
}

/**
 * Mutation to sign in with a demo persona (student / owner).
 */
export function useDemoSignIn() {
  return useMutation<DemoSignInResponseDto, Error, DemoPersona>({
    mutationFn: (persona: DemoPersona) => authApi.demoSignIn(persona),
  });
}
