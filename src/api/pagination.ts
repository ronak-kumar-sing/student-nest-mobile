/**
 * Cursor-based pagination utilities for TanStack Query.
 *
 * The backend uses cursor pagination:
 * ```json
 * { "items": [...], "nextCursor": "abc123", "hasMore": true }
 * ```
 *
 * These helpers integrate with `useInfiniteQuery`.
 */

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Standard paginated response shape from the backend.
 * Every list endpoint returns this envelope.
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Parameters for a paginated request.
 */
export interface PaginationParams {
  cursor?: string | null;
  limit?: number;
}

// ─── Default page size ──────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;

// ─── TanStack Query Helpers ─────────────────────────────────────────

/**
 * `getNextPageParam` for `useInfiniteQuery`.
 *
 * Returns the next cursor if there are more pages, or `undefined`
 * to signal that all pages have been loaded.
 *
 * @example
 * useInfiniteQuery({
 *   queryKey: propertyKeys.list(filters),
 *   queryFn: ({ pageParam }) => fetchProperties({ ...filters, cursor: pageParam }),
 *   initialPageParam: null,
 *   getNextPageParam: getNextPageParam,
 * });
 */
export function getNextPageParam<T>(lastPage: PaginatedResponse<T>): string | null | undefined {
  return lastPage.hasMore ? lastPage.nextCursor : undefined;
}

/**
 * Flatten all pages from an infinite query into a single array of items.
 *
 * @example
 * const { data } = useInfinitePropertyList(filters);
 * const allProperties = flattenPages(data?.pages);
 */
export function flattenPages<T>(pages: PaginatedResponse<T>[] | undefined): T[] {
  if (!pages) return [];
  return pages.flatMap((page) => page.items);
}

/**
 * Get the total number of items loaded across all pages.
 */
export function getTotalLoadedCount<T>(pages: PaginatedResponse<T>[] | undefined): number {
  if (!pages) return 0;
  return pages.reduce((total, page) => total + page.items.length, 0);
}

/**
 * Check if any page has been loaded (i.e. at least one page with items).
 */
export function hasLoadedData<T>(pages: PaginatedResponse<T>[] | undefined): boolean {
  return getTotalLoadedCount(pages) > 0;
}
