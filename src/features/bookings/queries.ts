import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Page } from '@/api/http';
import { getNextPageParam } from '@/api/pagination';
import { queryKeyRoots } from '@/api/query-keys';
import { toast } from '@/components/ui/toast';
import { bookingsApi } from './api';
import type { BookingActionDto, BookingDto, CreateBookingDto } from './types';

export const bookingKeys = {
  all: [queryKeyRoots.bookings] as const,
  list: (params?: { status?: string }) => [...bookingKeys.all, 'list', params] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
};

export function useInfiniteBookingsQuery(params?: { status?: string; limit?: number }) {
  return useInfiniteQuery<Page<BookingDto>, Error, InfiniteData<Page<BookingDto>, string | null>, readonly unknown[], string | null>({
    queryKey: bookingKeys.list(params),
    queryFn: ({ pageParam, signal }) =>
      bookingsApi.getBookings(
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

export function useBookingQuery(id: string) {
  return useQuery<BookingDto>({
    queryKey: bookingKeys.detail(id),
    queryFn: ({ signal }) => bookingsApi.getBooking(id, signal),
    enabled: Boolean(id),
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: {
      data: CreateBookingDto;
      idempotencyKey?: string;
    }) => bookingsApi.createBooking(data, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useBookingActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: BookingActionDto;
    }) => bookingsApi.actOnBooking(id, action),
    onSuccess: (updated) => {
      queryClient.setQueryData(bookingKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
    },
    onError: () => {
      toast.error('Failed to update booking status');
    },
  });
}
