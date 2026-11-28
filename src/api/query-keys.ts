/**
 * Shared query key root prefixes for cross-feature cache invalidation.
 *
 * Features must not import each other's query key factories.
 * Instead, invalidate using these prefix strings:
 * e.g. queryClient.invalidateQueries({ queryKey: [queryKeyRoots.search] })
 */

export const queryKeyRoots = {
  search: 'search',
  properties: 'properties',
  favorites: 'favorites',
  bookings: 'bookings',
  roommates: 'roommates',
} as const;
