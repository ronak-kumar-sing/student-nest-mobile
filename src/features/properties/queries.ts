import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import type { Page } from '@/api/http';
import { getNextPageParam } from '@/api/pagination';
import { queryKeyRoots } from '@/api/query-keys';
import { propertiesApi } from './api';
import type { PropertyOwnerDto, PropertyPublicDto } from './types';

export const propertyKeys = {
  all: [queryKeyRoots.properties] as const,
  detail: (id: string) => [...propertyKeys.all, 'detail', id] as const,
  mine: (params?: { status?: string }) => [...propertyKeys.all, 'mine', params] as const,
};

export function usePropertyQuery(id: string) {
  return useQuery<PropertyPublicDto>({
    queryKey: propertyKeys.detail(id),
    queryFn: ({ signal }) => propertiesApi.getProperty(id, signal),
    enabled: Boolean(id),
  });
}

export function useMyListingsQuery(params?: { status?: string; limit?: number }) {
  return useInfiniteQuery<Page<PropertyOwnerDto>, Error, InfiniteData<Page<PropertyOwnerDto>, string | null>, readonly unknown[], string | null>({
    queryKey: propertyKeys.mine(params),
    queryFn: ({ pageParam, signal }) =>
      propertiesApi.getMyListings(
        {
          ...params,
          cursor: pageParam,
        },
        signal,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage),
  });
}
