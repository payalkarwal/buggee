/**
 * useRoute Hook
 * Auto-fetch routes when pickup/drop coordinates change
 */

import { useEffect } from 'react';
import { fetchRoute } from '@/services/routeService';
import { useRideStore } from '@/store/rideStore';

export function useRoute(mapRef: React.RefObject<any>) {
  const {
    pickupCoords,
    dropCoords,
    setRouteCoordinates,
    setRouteInfo,
    setIsLoadingRoute,
  } = useRideStore();

  // Auto-fetch route when both pickup and drop coordinates are set
  useEffect(() => {
    console.log('🗺️ Route useEffect - pickup:', pickupCoords, 'drop:', dropCoords);

    if (pickupCoords && dropCoords) {
      console.log('🚗 Fetching route...');

      const fetchAndSetRoute = async () => {
        setIsLoadingRoute(true);

        const result = await fetchRoute(
          pickupCoords.latitude,
          pickupCoords.longitude,
          dropCoords.latitude,
          dropCoords.longitude
        );

        if (result) {
          setRouteCoordinates(result.coordinates);
          setRouteInfo(result.info);

          // Fit map to show the entire route
          if (mapRef.current && result.coordinates.length > 0) {
            mapRef.current.fitToCoordinates(result.coordinates, {
              edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
              animated: true,
            });
          }
        }

        setIsLoadingRoute(false);
      };

      fetchAndSetRoute();
    }
  }, [pickupCoords, dropCoords, mapRef, setRouteCoordinates, setRouteInfo, setIsLoadingRoute]);
}
