import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSessionStore } from '@/stores/session';
import { resolveRoute } from '../routing';

/**
 * Invisible navigator watcher that enforces routing rules based on session status.
 */
export function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);

  useEffect(() => {
    const target = resolveRoute(status, role, segments);
    if (target) {
      // `resolveRoute` returns plain strings; typed routes cannot express that union, so cast.
      router.replace(target as Parameters<typeof router.replace>[0]);
    }
  }, [status, role, segments, router]);

  return null;
}
