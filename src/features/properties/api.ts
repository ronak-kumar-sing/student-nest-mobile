import { http, type Page, type QueryValue } from '@/api/http';
import { bindTransport } from '@/api/transport';
import { getDB } from '@/api/mock/db';
import { simulateLatency } from '@/api/mock/latency';
import { createMockError, getInjectedError, shouldInjectError } from '@/api/mock/errors';
import { ErrorCodes } from '@/api/errors';
import {
  getMockCurrentUserId,
  mockPropertyToOwnerDto,
  mockPropertyToPublicDto,
} from '@/api/mock/adapters';
import type { PropertyOwnerDto, PropertyPublicDto } from './types';

export interface PropertiesApi {
  getProperty(id: string, signal?: AbortSignal): Promise<PropertyPublicDto>;
  getMyListings(
    params?: { status?: string; cursor?: string | null; limit?: number },
    signal?: AbortSignal,
  ): Promise<Page<PropertyOwnerDto>>;
}

// ─── HTTP Implementation ────────────────────────────────────────────

export const httpPropertiesApi: PropertiesApi = {
  async getProperty(id, signal) {
    return http.get<PropertyPublicDto>(`/v1/properties/${id}`, {
      signal,
      auth: 'optional',
    });
  },

  async getMyListings(params, signal) {
    const response = await http.get<Page<PropertyOwnerDto>>('/v1/properties/mine', {
      query: {
        status: params?.status ?? undefined,
        cursor: params?.cursor ?? undefined,
        limit: params?.limit ?? undefined,
      } as Record<string, QueryValue>,
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
};

// ─── Mock Implementation ────────────────────────────────────────────

function encodeCursor(offset: number): string {
  return typeof btoa === 'function' ? btoa(String(offset)) : String(offset);
}

function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try {
    const raw = typeof atob === 'function' ? atob(cursor) : cursor;
    const num = parseInt(raw, 10);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

export const mockPropertiesApi: PropertiesApi = {
  async getProperty(id, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }

    const db = getDB();
    const property = db.properties.find((p) => p.id === id);
    if (!property) {
      throw createMockError(404, ErrorCodes.NOT_FOUND, 'Property not found');
    }

    const currentUserId = getMockCurrentUserId('student');
    return mockPropertyToPublicDto(property, currentUserId);
  },

  async getMyListings(params, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }

    const db = getDB();
    const currentOwnerId = getMockCurrentUserId('owner');
    let listings = db.properties.filter((p) => p.ownerId === currentOwnerId);

    if (params?.status) {
      listings = listings.filter((p) => p.status === params.status);
    }

    const limit = params?.limit ?? 20;
    const offset = decodeCursor(params?.cursor);
    const total = listings.length;
    const paged = listings.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    const nextCursor = hasMore ? encodeCursor(offset + limit) : null;

    return {
      items: paged.map((p) => mockPropertyToOwnerDto(p)),
      nextCursor,
      hasMore,
    };
  },
};

export const propertiesApi = bindTransport('properties', {
  mock: mockPropertiesApi,
  http: httpPropertiesApi,
});
