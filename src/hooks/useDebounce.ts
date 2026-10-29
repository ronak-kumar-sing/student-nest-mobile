/**
 * Debounce a rapidly-changing value.
 *
 * Returns a debounced copy of `value` that only updates after the
 * specified `delay` (default 300 ms) has elapsed since the last change.
 *
 * @example
 * const [text, setText] = useState('');
 * const debouncedText = useDebounce(text, 400);
 *
 * useEffect(() => {
 *   // fires 400 ms after the user stops typing
 *   search(debouncedText);
 * }, [debouncedText]);
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
