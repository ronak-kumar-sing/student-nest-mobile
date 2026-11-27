/**
 * Transport binder for API feature modules.
 *
 * Dispatches method calls dynamically to either the mock or http implementation
 * based on `getTransportMode(feature)` evaluated at call time.
 */

import { getTransportMode, type FeatureName } from './mode';

/**
 * Binds an API module with mock and http implementations.
 *
 * Each method call picks `impls[getTransportMode(feature)]` at invocation time,
 * allowing dev-menu runtime toggles to take effect immediately without app reload.
 *
 * @param feature The feature name registered in FeatureName
 * @param impls Object containing both mock and http implementations
 */
export function bindTransport<T extends object>(
  feature: FeatureName,
  impls: { mock: T; http: T },
): T {
  const bound = {} as Record<string | symbol, unknown>;

  // Iterate over all own keys of the mock implementation
  const keys = Object.keys(impls.mock) as (keyof T)[];

  for (const key of keys) {
    const mockVal = impls.mock[key];
    if (typeof mockVal === 'function') {
      bound[key as string] = (...args: unknown[]) => {
        const mode = getTransportMode(feature);
        const targetImpl = impls[mode];
        const targetFn = targetImpl[key];
        if (typeof targetFn === 'function') {
          return (targetFn as (...fnArgs: unknown[]) => unknown).apply(targetImpl, args);
        }
        throw new Error(
          `[bindTransport] Method '${String(key)}' is not implemented in '${mode}' mode for feature '${feature}'`,
        );
      };
    } else {
      Object.defineProperty(bound, key, {
        get() {
          const mode = getTransportMode(feature);
          return impls[mode][key];
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  // Cast justification: bound delegates every own property of T to the active mode implementation of T.
  return bound as T;
}
