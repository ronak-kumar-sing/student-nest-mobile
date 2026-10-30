/**
 * Development settings store.
 *
 * Persisted to MMKV. Only available / meaningful in development builds.
 * Controls mock-vs-http transport per feature, artificial latency,
 * forced error injection, and simulated offline mode.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

// ─── Types ──────────────────────────────────────────────────────────

export interface DevSettingsState {
  /**
   * Per-feature transport overrides.
   * Keys are feature names (e.g. "auth", "properties").
   * If a feature is not in this map, the global `EXPO_PUBLIC_API_MODE` is used.
   */
  apiModeOverrides: Record<string, 'mock' | 'http'>;

  /** Artificial latency added to mock responses (ms) */
  mockLatency: number;

  /** Error code to forcefully inject in mock responses (e.g. "RATE_LIMITED") */
  forceError: string | null;

  /** Simulate offline mode regardless of actual network status */
  isOffline: boolean;

  /** Set the transport mode for a specific feature */
  setApiMode: (feature: string, mode: 'mock' | 'http') => void;

  /** Set the artificial mock latency in milliseconds */
  setMockLatency: (ms: number) => void;

  /** Set (or clear) the forced error code */
  setForceError: (code: string | null) => void;

  /** Toggle simulated offline mode */
  setOffline: (value: boolean) => void;

  /** Reset all dev settings to defaults */
  resetAll: () => void;
}

// ─── Defaults ───────────────────────────────────────────────────────

const defaultSettings = {
  apiModeOverrides: {} as Record<string, 'mock' | 'http'>,
  mockLatency: 500,
  forceError: null,
  isOffline: false,
} as const;

// ─── Store ──────────────────────────────────────────────────────────

export const useDevSettingsStore = create<DevSettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setApiMode: (feature, mode) =>
        set((state) => ({
          apiModeOverrides: { ...state.apiModeOverrides, [feature]: mode },
        })),

      setMockLatency: (ms) => set({ mockLatency: ms }),

      setForceError: (code) => set({ forceError: code }),

      setOffline: (value) => set({ isOffline: value }),

      resetAll: () => set({ ...defaultSettings }),
    }),
    {
      name: 'student-nest-dev-settings',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        apiModeOverrides: state.apiModeOverrides,
        mockLatency: state.mockLatency,
        forceError: state.forceError,
        isOffline: state.isOffline,
      }),
    },
  ),
);
