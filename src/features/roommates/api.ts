import { http, type Page } from '@/api/http';
import { bindTransport } from '@/api/transport';
import { ErrorCodes, isApiError } from '@/api/errors';
import { createIdempotencyKey } from '@/api/http/client';
import { getRoommatesMock } from '@/api/mock/roommates';
import type {
  RoommatesApi,
  RoommateProfileDto,
  UpsertRoommateProfileDto,
  RoommateMatchesDto,
  RoommateRequestDto,
  RoommateRequestActionDto,
} from './types';

// ─── HTTP Implementation ────────────────────────────────────────────

export const httpRoommatesApi: RoommatesApi = {
  async getProfile(signal?: AbortSignal): Promise<RoommateProfileDto | null> {
    try {
      return await http.get<RoommateProfileDto>('/v1/roommates/profile', {
        signal,
        auth: 'required',
      });
    } catch (error) {
      if (isApiError(error) && error.code === ErrorCodes.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },

  async upsertProfile(
    dto: UpsertRoommateProfileDto,
    signal?: AbortSignal,
  ): Promise<RoommateProfileDto> {
    return http.put<RoommateProfileDto>('/v1/roommates/profile', dto, {
      signal,
      auth: 'required',
    });
  },

  async setProfileActive(active: boolean, signal?: AbortSignal): Promise<RoommateProfileDto> {
    return http.post<RoommateProfileDto>(
      '/v1/roommates/profile/actions',
      { action: active ? 'activate' : 'deactivate' },
      {
        signal,
        auth: 'required',
      },
    );
  },

  async getMatches(signal?: AbortSignal, limit: number = 50): Promise<RoommateMatchesDto> {
    return http.get<RoommateMatchesDto>('/v1/roommates/matches', {
      query: { limit },
      signal,
      auth: 'required',
    });
  },

  async sendRequest(
    params: { toUid: string; message?: string },
    signal?: AbortSignal,
  ): Promise<RoommateRequestDto> {
    return http.post<RoommateRequestDto>('/v1/roommates/requests', params, {
      signal,
      auth: 'required',
      idempotencyKey: createIdempotencyKey(),
    });
  },

  async listRequests(
    params?: {
      direction?: 'incoming' | 'outgoing';
      status?: string;
      cursor?: string | null;
      limit?: number;
    },
    signal?: AbortSignal,
  ): Promise<Page<RoommateRequestDto>> {
    const response = await http.get<Page<RoommateRequestDto>>('/v1/roommates/requests', {
      query: {
        direction: params?.direction ?? 'incoming',
        status: params?.status ?? undefined,
        cursor: params?.cursor ?? undefined,
        limit: params?.limit ?? undefined,
      },
      signal,
      auth: 'required',
    });

    const nextCursor =
      typeof response.nextCursor === 'string'
        ? response.nextCursor
        : null;

    return {
      items: response.items,
      nextCursor,
      hasMore: response.hasMore,
    };
  },

  async actOnRequest(
    id: string,
    action: RoommateRequestActionDto['action'],
    signal?: AbortSignal,
  ): Promise<RoommateRequestDto> {
    return http.post<RoommateRequestDto>(
      `/v1/roommates/requests/${encodeURIComponent(id)}/actions`,
      { action },
      {
        signal,
        auth: 'required',
      },
    );
  },
};

// ─── Mock Implementation ────────────────────────────────────────────

export const mockRoommatesApi: RoommatesApi = {
  async getProfile(_signal?: AbortSignal): Promise<RoommateProfileDto | null> {
    try {
      return await getRoommatesMock().getProfile();
    } catch (error) {
      if (isApiError(error) && error.code === ErrorCodes.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  },

  async upsertProfile(
    dto: UpsertRoommateProfileDto,
    _signal?: AbortSignal,
  ): Promise<RoommateProfileDto> {
    return getRoommatesMock().upsertProfile(dto);
  },

  async setProfileActive(active: boolean, _signal?: AbortSignal): Promise<RoommateProfileDto> {
    return getRoommatesMock().setProfileActive(active);
  },

  async getMatches(_signal?: AbortSignal, limit?: number): Promise<RoommateMatchesDto> {
    return getRoommatesMock().getMatches(limit);
  },

  async sendRequest(
    params: { toUid: string; message?: string },
    _signal?: AbortSignal,
  ): Promise<RoommateRequestDto> {
    return getRoommatesMock().sendRequest(params);
  },

  async listRequests(
    params?: {
      direction?: 'incoming' | 'outgoing';
      status?: string;
      cursor?: string | null;
      limit?: number;
    },
    _signal?: AbortSignal,
  ): Promise<Page<RoommateRequestDto>> {
    return getRoommatesMock().listRequests(params);
  },

  async actOnRequest(
    id: string,
    action: RoommateRequestActionDto['action'],
    _signal?: AbortSignal,
  ): Promise<RoommateRequestDto> {
    return getRoommatesMock().actOnRequest(id, action);
  },
};

// ─── Bound Transport ────────────────────────────────────────────────

export const roommatesApi = bindTransport('roommates', {
  mock: mockRoommatesApi,
  http: httpRoommatesApi,
});
