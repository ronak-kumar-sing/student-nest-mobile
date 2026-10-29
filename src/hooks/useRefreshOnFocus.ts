/**
 * Re-fetch a TanStack Query when the screen regains focus.
 *
 * Skips the first mount to avoid a double fetch (the query already
 * fires on mount). Subsequent focus events trigger `refetch()`.
 *
 * @example
 * const { data, refetch } = usePropertyQuery(id);
 * useRefreshOnFocus(refetch);
 */

import { useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

export function useRefreshOnFocus(refetch: () => void): void {
  const isFirstMount = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }

      refetch();
    }, [refetch]),
  );
}
