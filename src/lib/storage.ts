/**
 * MMKV-backed key-value storage for the Student Nest app.
 *
 * Used as the persistence layer for:
 * - Zustand `persist` middleware
 * - TanStack Query async storage persister
 * - General app preferences
 *
 * Falls back to an in-memory storage if native MMKV / NitroModules
 * is not linked or running in an environment without native modules (e.g. Expo Go).
 *
 * Sensitive data (tokens, secrets) must use `expo-secure-store` instead.
 */

export interface StorageAdapter {
  getString(key: string): string | undefined;
  set(key: string, value: string | boolean | number): void;
  remove(key: string): boolean;
  getAllKeys(): string[];
  clearAll(): void;
}

class InMemoryStorage implements StorageAdapter {
  private store = new Map<string, string>();

  getString(key: string): string | undefined {
    return this.store.get(key);
  }

  set(key: string, value: string | boolean | number): void {
    this.store.set(key, String(value));
  }

  remove(key: string): boolean {
    return this.store.delete(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.store.keys());
  }

  clearAll(): void {
    this.store.clear();
  }
}

function initStorage(): StorageAdapter {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require('react-native-mmkv');
    return createMMKV({ id: 'student-nest-storage' });
  } catch {
    if (__DEV__) {
      console.warn(
        '[Storage] Native MMKV/NitroModules not found in current runtime. Falling back to in-memory storage. Note: Rebuild your dev client (npx expo run:android) to enable persistent MMKV storage.',
      );
    }
    return new InMemoryStorage();
  }
}

export const storage = initStorage();

/**
 * Get a string value from storage.
 * Returns `null` if the key does not exist.
 */
export function getItem(key: string): string | null {
  return storage.getString(key) ?? null;
}

/**
 * Set a string value in storage.
 */
export function setItem(key: string, value: string): void {
  storage.set(key, value);
}

/**
 * Remove a key from storage.
 */
export function removeItem(key: string): void {
  storage.remove(key);
}

/**
 * Get all keys currently stored.
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
 * Wraps storage with the async interface expected by `@tanstack/query-async-storage-persister`.
 */
export const queryClientStorage = {
  getItem: (key: string): string | null => getItem(key),
  setItem: (key: string, value: string): void => setItem(key, value),
  removeItem: (key: string): void => removeItem(key),
};
