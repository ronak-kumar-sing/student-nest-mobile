/**
 * Track the app's foreground/background state.
 *
 * Returns `'active'`, `'background'`, or `'inactive'` (iOS only).
 * Useful for pausing expensive operations when the app is backgrounded
 * and resuming them when it returns to the foreground.
 *
 * @example
 * const appState = useAppState();
 *
 * useEffect(() => {
 *   if (appState === 'active') {
 *     reconnectWebSocket();
 *   }
 * }, [appState]);
 */

import { useState, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useAppState(): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(
    (AppState.currentState as AppStateStatus) || 'active',
  );
  const currentState = useRef<AppStateStatus>(
    (AppState.currentState as AppStateStatus) || 'active',
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      currentState.current = nextState;
      setAppState(nextState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
}

/**
 * Run a callback when the app transitions from background → active.
 * Useful for refreshing data, re-syncing state, etc.
 */
export function useOnForeground(callback: () => void): void {
  const previousState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        previousState.current &&
        /inactive|background/.test(previousState.current) &&
        nextState === 'active'
      ) {
        callback();
      }
      previousState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [callback]);
}
