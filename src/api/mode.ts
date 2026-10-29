/**
 * Transport mode selection.
 *
 * Decides whether a feature should use the mock backend or hit the real HTTP API.
 *
 * Priority:
 * 1. Per-feature override from the dev settings store (runtime toggle in dev menu)
 * 2. `EXPO_PUBLIC_API_MODE` environment variable
 * 3. Default: `'mock'`
 */

import { useDevSettingsStore } from '@/stores/dev-settings';

// ─── Feature Names ──────────────────────────────────────────────────

/**
 * All feature names that have a transport layer.
 * Used to type the per-feature mode overrides.
 */
export type FeatureName =
  | 'auth'
  | 'users'
  | 'verification'
  | 'properties'
  | 'search'
  | 'favorites'
  | 'bookings'
  | 'tours'
  | 'inquiries'
  | 'notifications'
  | 'roommates'
  | 'reviews'
  | 'reports'
  | 'analytics';

// ─── Transport Mode ─────────────────────────────────────────────────

export type TransportMode = 'mock' | 'http';

/**
 * Read the global default transport mode from the environment.
 * Set via `EXPO_PUBLIC_API_MODE=mock|http` in `.env` or `eas.json`.
 */
function getGlobalDefault(): TransportMode {
  const envMode = process.env.EXPO_PUBLIC_API_MODE;

  if (envMode === 'http') return 'http';
  if (envMode === 'mock') return 'mock';

  // Default to mock if not set or invalid
  return 'mock';
}

/**
 * Get the transport mode for a specific feature.
 *
 * Checks for a per-feature runtime override first (set via the dev menu),
 * then falls back to the global `EXPO_PUBLIC_API_MODE` env var.
 *
 * @param feature — the feature name to check
 * @returns `'mock'` or `'http'`
 *
 * @example
 * const mode = getTransportMode('properties');
 * if (mode === 'mock') {
 *   return mockPropertyApi;
 * } else {
 *   return httpPropertyApi;
 * }
 */
export function getTransportMode(feature: FeatureName): TransportMode {
  // Check for runtime per-feature override (dev builds only)
  const overrides = useDevSettingsStore.getState().apiModeOverrides;
  const override = overrides[feature];

  if (override === 'mock' || override === 'http') {
    return override;
  }

  return getGlobalDefault();
}

/**
 * Check whether a feature is currently using mock transport.
 */
export function isMockMode(feature: FeatureName): boolean {
  return getTransportMode(feature) === 'mock';
}

/**
 * Check whether a feature is currently using HTTP transport.
 */
export function isHttpMode(feature: FeatureName): boolean {
  return getTransportMode(feature) === 'http';
}
