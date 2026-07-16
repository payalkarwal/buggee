/**
 * useLocationSearch Hook
 * Debounced location search with LocationIQ API
 */

import { useRef, useCallback } from 'react';
import { searchLocations } from '@/services/locationService';
import { useRideStore } from '@/store/rideStore';

const SEARCH_DEBOUNCE_MS = 400; // Optimal UX: 300-500ms

export function useLocationSearch() {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    locationSearchQuery,
    setLocationSearchQuery,
    setSearchResults,
    setIsSearching,
    clearSearch,
  } = useRideStore();

  /**
   * Debounced search function
   * Cancels previous search if user is still typing
   */
  const search = useCallback(
    (query: string) => {
      setLocationSearchQuery(query);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search
      searchTimeoutRef.current = setTimeout(async () => {
        if (query.trim().length >= 2) {
          setIsSearching(true);
          const results = await searchLocations(query);
          setSearchResults(results);
          setIsSearching(false);
        } else {
          setSearchResults([]);
          setIsSearching(false);
        }
      }, SEARCH_DEBOUNCE_MS);
    },
    [setLocationSearchQuery, setSearchResults, setIsSearching]
  );

  return {
    locationSearchQuery,
    search,
    clearSearch,
  };
}
