import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { usersApi } from './api';
import { useSessionStore } from '@/stores/session';
import { mapUserMeDtoToSessionUser } from '@/features/auth/mappers';
import { isApiError, getErrorMessage } from '@/api/errors';
import { toast } from '@/components/ui/toast';
import i18n from '@/i18n';
import type {
  UserMeDto,
  UpdateProfileDto,
  BecomeOwnerDto,
  BecomeOwnerResponseDto,
} from './types';

// ─── Query Keys Factory ─────────────────────────────────────────────

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

// ─── Queries ────────────────────────────────────────────────────────

/**
 * Hook to fetch current user's profile and verification state.
 * Enabled only when user is authenticated.
 */
export function useMyProfile(): UseQueryResult<UserMeDto, Error> {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: userKeys.me(),
    queryFn: ({ signal }) => usersApi.getMe(signal),
    enabled: isAuthenticated,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────

/**
 * Mutation to update current user's profile fields.
 */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation<UserMeDto, Error, UpdateProfileDto>({
    mutationFn: (patch: UpdateProfileDto) => usersApi.updateMe(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.me(), data);
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

      const current = useSessionStore.getState().user;
      if (current) {
        useSessionStore.getState().setUser({
          ...current,
          displayName: data.displayName ?? current.displayName,
          phone: data.phone ?? current.phone,
        });
      }
      toast.success(i18n.t('profile.updatedSuccess'));
    },
    onError: (err) => {
      if (isApiError(err)) {
        toast.error(i18n.t(getErrorMessage(err.code)));
      } else {
        toast.error(i18n.t('common.error'));
      }
    },
  });
}

/**
 * Mutation to switch a student account to an owner account.
 */
export function useBecomeOwner() {
  const queryClient = useQueryClient();
  return useMutation<BecomeOwnerResponseDto, Error, BecomeOwnerDto | undefined>({
    mutationFn: (input?: BecomeOwnerDto) => usersApi.becomeOwner(input),
    onSuccess: (response) => {
      const mapped = mapUserMeDtoToSessionUser(response.user);
      // The new role makes AuthGate re-route to the owner tabs.
      useSessionStore.getState().setUser(mapped);
      void queryClient.invalidateQueries();
      toast.success(i18n.t('profile.becomeOwnerSuccess'));
    },
    onError: (err) => {
      if (isApiError(err)) {
        toast.error(i18n.t(getErrorMessage(err.code)));
      } else {
        toast.error(i18n.t('common.error'));
      }
    },
  });
}
