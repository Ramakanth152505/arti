import { useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query. Used only where behaviour genuinely has to
 * change (drawer lifecycle, Escape handling) — pure visual adaptation stays in
 * CSS. Falls back to `false` when `matchMedia` is unavailable.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  };

  const getSnapshot = () =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(query).matches
      : false;

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** True when the layout uses the overlay navigation drawer instead of the rail. */
export const useIsMobileNav = (): boolean => useMediaQuery('(max-width: 1023.98px)');
