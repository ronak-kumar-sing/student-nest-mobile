import { http, type Page, type QueryValue } from '@/api/http';
import type { Schemas } from '@/api/http/types';
import { bindTransport } from '@/api/transport';
import { getDB } from '@/api/mock/db';
import { simulateLatency } from '@/api/mock/latency';
import { getInjectedError, shouldInjectError } from '@/api/mock/errors';
import { adaptAmenities, adaptGenderPolicy, adaptRoomType, mockPropertyToRoomCardDto, type ApiAmenity } from '@/api/mock/adapters';
import type { CityDto, RoomCardDto } from './types';

export interface SearchRoomsResult extends Page<RoomCardDto> {
  total: number;
  facets?: Schemas['SearchFacetsDto'];
}

export interface SearchApi {
  searchRooms(params?: Record<string, QueryValue>, signal?: AbortSignal): Promise<SearchRoomsResult>;
  getCities(params?: { q?: string; limit?: number }, signal?: AbortSignal): Promise<CityDto[]>;
}

// ─── HTTP Implementation ────────────────────────────────────────────

export const httpSearchApi: SearchApi = {
  async searchRooms(params, signal) {
    const response = await http.get<Schemas['SearchRoomsResponseDto']>('/v1/search/rooms', {
      query: params,
      signal,
      auth: 'optional',
    });

    const nextCursor =
      typeof response.nextCursor === 'string'
        ? response.nextCursor
        : null;

    return {
      items: response.items,
      nextCursor,
      hasMore: response.hasMore,
      total: response.total,
      facets: response.facets,
    };
  },

  async getCities(params, signal) {
    return http.get<CityDto[]>('/v1/search/cities', {
      query: params as Record<string, QueryValue>,
      signal,
      auth: 'none',
    });
  },
};

// ─── Mock Implementation ────────────────────────────────────────────

const KNOWN_CITIES: CityDto[] = [
  { slug: 'indore', name: 'Indore', state: 'Madhya Pradesh', listingCount: 0 },
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', listingCount: 0 },
  { slug: 'pune', name: 'Pune', state: 'Maharashtra', listingCount: 0 },
];

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

export const mockSearchApi: SearchApi = {
  async searchRooms(params, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }

    const db = getDB();
    const cityParam = params?.city ? String(params.city).toLowerCase() : undefined;
    const queryParam = params?.q ? String(params.q).toLowerCase().trim() : undefined;
    const minRentRupees = typeof params?.minRent === 'number' ? params.minRent : undefined;
    const maxRentRupees = typeof params?.maxRent === 'number' ? params.maxRent : undefined;
    const roomTypeParam = params?.roomType;
    const genderPolicyParam = params?.genderPolicy ? String(params.genderPolicy) : undefined;
    const sortParam = params?.sort ? String(params.sort) : 'relevance';
    const limit = typeof params?.limit === 'number' ? params.limit : 20;
    const cursor = typeof params?.cursor === 'string' ? params.cursor : undefined;

    let filtered = db.properties.filter((p) => p.status === 'published');

    if (cityParam) {
      filtered = filtered.filter(
        (p) => p.city.toLowerCase() === cityParam || p.city.toLowerCase().includes(cityParam),
      );
    }

    if (queryParam) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(queryParam) ||
          p.locality.toLowerCase().includes(queryParam) ||
          p.city.toLowerCase().includes(queryParam),
      );
    }

    if (minRentRupees !== undefined) {
      filtered = filtered.filter((p) => Math.floor(p.rentPaise / 100) >= minRentRupees);
    }

    if (maxRentRupees !== undefined) {
      filtered = filtered.filter((p) => Math.ceil(p.rentPaise / 100) <= maxRentRupees);
    }

    if (roomTypeParam) {
      const roomTypes = Array.isArray(roomTypeParam) ? roomTypeParam : [roomTypeParam];
      const validSet = new Set(roomTypes.map((rt) => String(rt).toLowerCase()));
      filtered = filtered.filter((p) => validSet.has(adaptRoomType(p.roomType)));
    }

    if (genderPolicyParam) {
      filtered = filtered.filter(
        (p) => adaptGenderPolicy(p.genderPolicy) === genderPolicyParam,
      );
    }

    if (params?.amenities && Array.isArray(params.amenities) && params.amenities.length > 0) {
      const required = new Set(params.amenities.map(String));
      filtered = filtered.filter((p) => {
        const propSlugs = new Set(adaptAmenities(p.amenities));
        for (const req of required) {
          if (!propSlugs.has(req as ApiAmenity)) return false;
        }
        return true;
      });
    }

    // Sort
    if (sortParam === 'rent_asc') {
      filtered.sort((a, b) => a.rentPaise - b.rentPaise);
    } else if (sortParam === 'rent_desc') {
      filtered.sort((a, b) => b.rentPaise - a.rentPaise);
    } else if (sortParam === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortParam === 'newest') {
      filtered.sort((a, b) => b.id.localeCompare(a.id));
    }

    const total = filtered.length;
    const offset = decodeCursor(cursor);
    const paged = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    const nextCursor = hasMore ? encodeCursor(offset + limit) : null;

    return {
      items: paged.map((p) => mockPropertyToRoomCardDto(p)),
      nextCursor,
      hasMore,
      total,
    };
  },

  async getCities(params, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }

    const db = getDB();
    const counts: Record<string, number> = {};
    for (const p of db.properties) {
      if (p.status === 'published') {
        const slug = p.city.toLowerCase();
        counts[slug] = (counts[slug] ?? 0) + 1;
      }
    }

    let cities = KNOWN_CITIES.map((c) => ({
      ...c,
      listingCount: counts[c.slug] ?? 0,
    }));

    if (params?.q) {
      const query = params.q.toLowerCase().trim();
      cities = cities.filter(
        (c) => c.name.toLowerCase().includes(query) || c.slug.includes(query),
      );
    }

    return cities;
  },
};

export const searchApi = bindTransport('search', {
  mock: mockSearchApi,
  http: httpSearchApi,
});
