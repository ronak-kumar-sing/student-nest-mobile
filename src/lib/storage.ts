/**
 * MMKV-backed key-value storage for the Student Nest app.
 *
 * Used as the persistence layer for:
 * - Zustand `persist` middleware
 * - TanStack Query async storage persister
 * - General app preferences
 *
 * Sensitive data (tokens, secrets) must use `expo-secure-store` instead.
 */

import { createMMKV } from 'react-native-mmkv';

/** Shared MMKV instance used across the app */
export const storage = createMMKV({
  id: 'student-nest-storage',
});

/**
 * Get a string value from MMKV storage.
 * Returns `null` if the key does not exist.
 */
export function getItem(key: string): string | null {
  return storage.getString(key) ?? null;
}

/**
 * Set a string value in MMKV storage.
 */
export function setItem(key: string, value: string): void {
  storage.set(key, value);
}

/**
 * Remove a key from MMKV storage.
 */
export function removeItem(key: string): void {
  storage.remove(key);
}

/**
 * Get all keys currently stored in MMKV.
 */
export function getAllKeys(): string[] {
  return storage.getAllKeys();
}

/**
 * Zustand-compatible storage adapter.
 * Implements the `StateStorage` interface expected by `zustand/middleware`.
 */
export const zustandStorage = {
  getItem,
  setItem,
  removeItem,
};

/**
 * TanStack Query async storage persister adapter.
 * Wraps MMKV with the async interface expected by `@tanstack/query-async-storage-persister`.
 */
export const queryClientStorage = {
  getItem: (key: string): string | null => getItem(key),
  setItem: (key: string, value: string): void => setItem(key, value),
  removeItem: (key: string): void => removeItem(key),
};
