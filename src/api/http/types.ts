/**
 * HTTP types and OpenAPI schema aliases.
 */

import type { components, paths } from '@/api/generated/schema';

export type Schemas = components['schemas'];
export type Paths = paths;

/**
 * Standard paginated response envelope.
 *
 * Note: The generated OpenAPI schema types `nextCursor` as `Record<string, never> | null`
 * because the backend spec defined it as `type: object, nullable` without properties.
 * In the actual backend and app runtime, `nextCursor` is an opaque base64 cursor string or null.
 */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
