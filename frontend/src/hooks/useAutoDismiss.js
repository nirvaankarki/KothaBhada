import { useEffect } from 'react';

export function useAutoDismiss(value, onClear, delay = 4000) {
  useEffect(() => {
    if (!value) return undefined;

    const timer = setTimeout(() => {
      onClear();
    }, delay);

    return () => clearTimeout(timer);
  }, [value, onClear, delay]);
}
