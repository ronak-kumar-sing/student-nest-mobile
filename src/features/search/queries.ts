import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import type { QueryValue } from '@/api/http';
import { getNextPageParam } from '@/api/pagination';
import { queryKeyRoots } from '@/api/query-keys';
import { searchApi, type SearchRoomsResult } from './api';
import type { CityDto } from './types';

export const searchKeys = {
  all: [queryKeyRoots.search] as const,
  cities: (params?: { q?: string; limit?: number }) =>
    [...searchKeys.all, 'cities', params] as const,
  rooms: (params?: Record<string, QueryValue>) =>
    [...searchKeys.all, 'rooms', params] as const,
};

export function useCitiesQuery(params?: { q?: string; limit?: number }) {
  return useQuery<CityDto[]>({
    queryKey: searchKeys.cities(params),
    queryFn: ({ signal }) => searchApi.getCities(params, signal),
  });
}

export function useInfiniteRoomsQuery(
  params?: Record<string, QueryValue>,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery<SearchRoomsResult, Error, InfiniteData<SearchRoomsResult, string | null>, readonly unknown[], string | null>({
    queryKey: searchKeys.rooms(params),
    queryFn: ({ pageParam, signal }) =>
      searchApi.searchRooms(
        {
          ...params,
          cursor: pageParam ?? undefined,
        },
        signal,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage),
    enabled: options?.enabled ?? true,
  });
}
