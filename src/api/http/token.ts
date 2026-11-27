/**
 * Auth token provider for HTTP requests.
 * Pluggable so tests and mocking can inject tokens without Firebase.
 */

import { getCurrentIdToken } from '@/lib/firebase';

export type AuthTokenProvider = (opts: { forceRefresh: boolean }) => Promise<string | null>;

let currentTokenProvider: AuthTokenProvider = ({ forceRefresh }) => getCurrentIdToken(forceRefresh);

/**
 * Configure a custom auth token provider.
 * Allows test suites to provide mock JWTs without initializing Firebase Auth.
 */
export function setAuthTokenProvider(provider: AuthTokenProvider): void {
  currentTokenProvider = provider;
}

/**
 * Retrieve an auth token using the active provider.
 */
export async function getAuthToken(
  opts: { forceRefresh: boolean } = { forceRefresh: false },
): Promise<string | null> {
  return currentTokenProvider(opts);
}

/**
 * Reset the token provider back to the default Firebase implementation.
 */
export function resetAuthTokenProvider(): void {
  currentTokenProvider = ({ forceRefresh }) => getCurrentIdToken(forceRefresh);
}
