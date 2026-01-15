'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the viewport matches a media query
 * @param query - CSS media query string (e.g., '(max-width: 767px)')
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current value to avoid hydration mismatch
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Create listener for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hook for mobile detection
 * @returns boolean indicating if viewport is mobile (<768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
