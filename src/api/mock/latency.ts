import { useDevSettingsStore } from '@/stores/dev-settings';

/**
 * Simulate network latency for mock API calls.
 * Defaults to 300ms base + 0..600ms random jitter (300-900ms total),
 * or the custom latency configured in dev settings.
 */
export async function simulateLatency(): Promise<void> {
  const baseLatency = useDevSettingsStore.getState().mockLatency;
  const jitter = Math.floor(Math.random() * 600);
  const total = baseLatency + jitter;
  await new Promise((resolve) => setTimeout(resolve, total));
}
