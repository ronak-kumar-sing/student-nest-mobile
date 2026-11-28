import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Page } from '@/api/http';
import { getNextPageParam } from '@/api/pagination';
import { queryKeyRoots } from '@/api/query-keys';
import { getErrorCode, getErrorMessage } from '@/api/errors';
import { toast } from '@/components/ui/toast';
import { roommatesApi } from './api';
import type {
  RoommateProfileDto,
  UpsertRoommateProfileDto,
  RoommateMatchesDto,
  RoommateRequestDto,
  RoommateRequestActionDto,
} from './types';

// ─── Query Keys Factory ─────────────────────────────────────────────

export const roommateKeys = {
  all: [queryKeyRoots.roommates] as const,
  profile: () => [...roommateKeys.all, 'profile'] as const,
  matches: (limit?: number) => [...roommateKeys.all, 'matches', limit ?? 50] as const,
  requestsRoot: () => [...roommateKeys.all, 'requests'] as const,
  requests: (direction: 'incoming' | 'outgoing', status?: string) =>
    [...roommateKeys.requestsRoot(), direction, status] as const,
};

// ─── Queries ────────────────────────────────────────────────────────

export function useRoommateProfile() {
  return useQuery<RoommateProfileDto | null, Error>({
    queryKey: roommateKeys.profile(),
    queryFn: ({ signal }) => roommatesApi.getProfile(signal),
  });
}

export function useRoommateMatches(enabled: boolean = true, limit: number = 50) {
  return useQuery<RoommateMatchesDto, Error>({
    queryKey: roommateKeys.matches(limit),
    queryFn: ({ signal }) => roommatesApi.getMatches(signal, limit),
    enabled,
  });
}

export function useInfiniteRoommateRequests(
  direction: 'incoming' | 'outgoing' = 'incoming',
  status?: string,
) {
  return useInfiniteQuery<
    Page<RoommateRequestDto>,
    Error,
    InfiniteData<Page<RoommateRequestDto>, string | null>,
    readonly unknown[],
    string | null
  >({
    queryKey: roommateKeys.requests(direction, status),
    queryFn: ({ pageParam, signal }) =>
      roommatesApi.listRequests({ direction, status, cursor: pageParam }, signal),
    initialPageParam: null,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage),
  });
}

// ─── Mutations ──────────────────────────────────────────────────────

export function useUpsertRoommateProfile() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (dto: UpsertRoommateProfileDto) => roommatesApi.upsertProfile(dto),
    onSuccess: (profile) => {
      queryClient.setQueryData(roommateKeys.profile(), profile);
      queryClient.invalidateQueries({ queryKey: roommateKeys.profile() });
      queryClient.invalidateQueries({ queryKey: roommateKeys.matches() });
      toast.success(t('roommates.profileSavedToast', 'Roommate profile saved!'));
    },
    onError: (err) => {
      const code = getErrorCode(err);
      toast.error(t(getErrorMessage(code)));
    },
  });
}

export function useSetRoommateProfileActive() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (active: boolean) => roommatesApi.setProfileActive(active),
    onSuccess: (profile, active) => {
      queryClient.setQueryData(roommateKeys.profile(), profile);
      queryClient.invalidateQueries({ queryKey: roommateKeys.profile() });
      queryClient.invalidateQueries({ queryKey: roommateKeys.matches() });
      queryClient.invalidateQueries({ queryKey: roommateKeys.requestsRoot() });

      if (active) {
        toast.success(t('roommates.activatedToast', 'Profile active! Matching students.'));
      } else {
        toast.info(t('roommates.hiddenToast', 'Profile hidden. Matches paused.'));
      }
    },
    onError: (err) => {
      const code = getErrorCode(err);
      toast.error(t(getErrorMessage(code)));
    },
  });
}

export function useSendRoommateRequest() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: { toUid: string; message?: string }) =>
      roommatesApi.sendRequest(params),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: roommateKeys.requestsRoot() });
      queryClient.invalidateQueries({ queryKey: roommateKeys.matches() });

      if (res.status === 'accepted') {
        toast.success(
          t(
            'roommates.mutualMatchSuccess',
            "It's a mutual match! You can now view their contact details.",
          ),
        );
      } else {
        toast.success(t('roommates.requestSentSuccess', 'Roommate request sent!'));
      }
    },
    onError: (err) => {
      const code = getErrorCode(err);
      toast.error(t(getErrorMessage(code)));
    },
  });
}

export function useRoommateRequestAction() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: RoommateRequestActionDto['action'];
    }) => roommatesApi.actOnRequest(id, action),
    onSuccess: (_data, { action }) => {
      queryClient.invalidateQueries({ queryKey: roommateKeys.requestsRoot() });
      queryClient.invalidateQueries({ queryKey: roommateKeys.matches() });

      if (action === 'accept') {
        toast.success(
          t('roommates.acceptedSuccess', 'Request accepted! Contact details shared.'),
        );
      } else if (action === 'decline') {
        toast.info(t('roommates.declinedSuccess', 'Request declined.'));
      } else if (action === 'cancel') {
        toast.info(t('roommates.cancelledSuccess', 'Request cancelled.'));
      }
    },
    onError: (err) => {
      const code = getErrorCode(err);
      toast.error(t(getErrorMessage(code)));
    },
  });
}
