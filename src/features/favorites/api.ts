import { http, type Page } from '@/api/http';
import { bindTransport } from '@/api/transport';
import { addFavorite as addFavoriteDb, getDB, removeFavorite as removeFavoriteDb } from '@/api/mock/db';
import { simulateLatency } from '@/api/mock/latency';
import { getInjectedError, shouldInjectError } from '@/api/mock/errors';
import { mockPropertyToFavoriteCardDto } from '@/api/mock/adapters';
import type { FavoriteCardDto } from './types';

export interface FavoritesApi {
  getFavorites(
    params?: { cursor?: string | null; limit?: number },
    signal?: AbortSignal,
  ): Promise<Page<FavoriteCardDto>>;
  addFavorite(
    propertyId: string,
    signal?: AbortSignal,
  ): Promise<{ propertyId: string; createdAt: string }>;
  removeFavorite(
    propertyId: string,
    signal?: AbortSignal,
  ): Promise<{ status: string }>;
}

// ─── HTTP Implementation ────────────────────────────────────────────

export const httpFavoritesApi: FavoritesApi = {
  async getFavorites(params, signal) {
    const response = await http.get<Page<FavoriteCardDto>>('/v1/favorites', {
      query: {
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

  async addFavorite(propertyId, signal) {
    return http.put<{ propertyId: string; createdAt: string }>(
      `/v1/favorites/${propertyId}`,
      undefined,
      {
        signal,
        auth: 'required',
      },
    );
  },

  async removeFavorite(propertyId, signal) {
    return http.delete<{ status: string }>(`/v1/favorites/${propertyId}`, {
      signal,
      auth: 'required',
    });
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

export const mockFavoritesApi: FavoritesApi = {
  async getFavorites(params, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }

    const db = getDB();
    const limit = params?.limit ?? 20;
    const offset = decodeCursor(params?.cursor);

    const favoriteProperties = db.properties.filter((p) => db.favorites.includes(p.id));
    const total = favoriteProperties.length;
    const paged = favoriteProperties.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    const nextCursor = hasMore ? encodeCursor(offset + limit) : null;

    return {
      items: paged.map((p) => mockPropertyToFavoriteCardDto(p)),
      nextCursor,
      hasMore,
    };
  },

  async addFavorite(propertyId, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }
    addFavoriteDb(propertyId);
    return {
      propertyId,
      createdAt: new Date().toISOString(),
    };
  },

  async removeFavorite(propertyId, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }
    removeFavoriteDb(propertyId);
    return {
      status: 'deleted',
    };
  },
};

export const favoritesApi = bindTransport('favorites', {
  mock: mockFavoritesApi,
  http: httpFavoritesApi,
});
