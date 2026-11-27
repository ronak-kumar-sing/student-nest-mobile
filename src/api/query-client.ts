/**
 * Shared TanStack Query client.
 *
 * Configured with smart retry rules:
 * - 4xx ApiErrors are NOT retried, except 408 (Request Timeout) and 429 (Rate Limited)
 * - Aborted queries (AbortError) are NEVER retried
 * - Network errors and 5xx server errors are retried up to 2 times
 * - Stale time: 1 minute, GC time: 30 minutes
 */

import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        if (failureCount >= 2) {
          return false;
        }

        // Never retry aborted requests
        if (
          (error instanceof Error && error.name === 'AbortError') ||
          (typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            (error as { name: unknown }).name === 'AbortError')
        ) {
          return false;
        }

        // Handle ApiError status codes
        if (isApiError(error)) {
          if (error.statusCode >= 400 && error.statusCode < 500) {
            // Only retry 408 (Request Timeout) and 429 (Rate Limited)
            return error.statusCode === 408 || error.statusCode === 429;
          }
        }

        return true;
      },
    },
  },
});
