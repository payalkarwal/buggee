/**
 * useMapControls Hook
 * Map control functions: recenter, fit to route
 */

import { useCallback } from 'react';
import { lightImpact } from '@/services/hapticService';
import { useRideStore } from '@/store/rideStore';
import type { LocationCoordinates } from '@/types/ride';

interface UseMapControlsParams {
  mapRef: React.RefObject<any>;
  userLocation: LocationCoordinates | null;
}

export function useMapControls({ mapRef, userLocation }: UseMapControlsParams) {
  const { pickupCoords, dropCoords, routeCoordinates } = useRideStore();

  /**
   * Smart recenter function:
   * - If route exists (pickup + drop selected): Fit route to view
   * - Otherwise: Center on user location
   */
  const handleRecenter = useCallback(() => {
    lightImpact();

    // Case 1: Route exists - fit both pickup and drop markers in view
    if (pickupCoords && dropCoords && routeCoordinates.length > 0) {
      mapRef.current?.fitToCoordinates([pickupCoords, dropCoords], {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 350, // Extra padding for drawer
          left: 50,
        },
        animated: true,
      });
      return;
    }

    // Case 2: Only pickup selected - fit to pickup
    if (pickupCoords) {
      mapRef.current?.animateToRegion(
        {
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        600
      );
      return;
    }

    // Case 3: No route - center on user location
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        600
      );
    }
  }, [mapRef, userLocation, pickupCoords, dropCoords, routeCoordinates]);

  return {
    handleRecenter,
  };
}
