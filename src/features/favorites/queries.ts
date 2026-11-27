import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Page } from '@/api/http';
import { getNextPageParam } from '@/api/pagination';
import { queryKeyRoots } from '@/api/query-keys';
import { toast } from '@/components/ui/toast';
import { favoritesApi } from './api';
import type { FavoriteCardDto } from './types';

export const favoriteKeys = {
  all: [queryKeyRoots.favorites] as const,
  list: () => [...favoriteKeys.all, 'list'] as const,
};

export function useInfiniteFavoritesQuery() {
  return useInfiniteQuery<Page<FavoriteCardDto>, Error, InfiniteData<Page<FavoriteCardDto>, string | null>, readonly unknown[], string | null>({
    queryKey: favoriteKeys.list(),
    queryFn: ({ pageParam, signal }) =>
      favoritesApi.getFavorites({ cursor: pageParam }, signal),
    initialPageParam: null,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage),
  });
}

export function useAddFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => favoritesApi.addFavorite(propertyId),
    onSuccess: () => {
      toast.success('Saved to your favorites!');
    },
    onError: () => {
      toast.error('Failed to save property');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyRoots.favorites] });
      queryClient.invalidateQueries({ queryKey: [queryKeyRoots.search] });
      queryClient.invalidateQueries({ queryKey: [queryKeyRoots.properties] });
    },
  });
}

export function useRemoveFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => favoritesApi.removeFavorite(propertyId),
    onMutate: async (propertyId: string) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });

      const previous = queryClient.getQueryData<InfiniteData<Page<FavoriteCardDto>>>(
        favoriteKeys.list(),
      );

      if (previous) {
        queryClient.setQueryData<InfiniteData<Page<FavoriteCardDto>>>(
          favoriteKeys.list(),
          {
            ...previous,
            pages: previous.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== propertyId),
            })),
          },
        );
      }

      return { previous };
    },
    onError: (_err, _propertyId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoriteKeys.list(), context.previous);
      }
      toast.error('Failed to remove from saved properties');
    },
    onSuccess: () => {
      toast.info('Removed from saved properties');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyRoots.favorites] });
      queryClient.invalidateQueries({ queryKey: [queryKeyRoots.search] });
      queryClient.invalidateQueries({ queryKey: [queryKeyRoots.properties] });
    },
  });
}

export function useToggleFavoriteMutation() {
  const addMutation = useAddFavoriteMutation();
  const removeMutation = useRemoveFavoriteMutation();

  return {
    toggle: (propertyId: string, currentLiked: boolean) => {
      if (currentLiked) {
        return removeMutation.mutateAsync(propertyId);
      } else {
        return addMutation.mutateAsync(propertyId);
      }
    },
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}
