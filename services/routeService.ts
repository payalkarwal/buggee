/**
 * Route Service
 * Handles OSRM routing API integration and route calculations
 */

import type { LocationCoordinates, RouteInfo } from '@/types/ride';

export interface RouteResponse {
  coordinates: LocationCoordinates[];
  info: RouteInfo;
}

// ═══════════════════════════════════════════════════════════════════
// OSRM ROUTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch route from OSRM API that follows actual roads
 * Returns coordinates and route info (distance, duration)
 */
export async function fetchRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResponse | null> {
  // Request multiple alternative routes from OSRM
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true`;
  console.log('🚗 OSRM URL:', url);

  try {
    // OSRM API - Returns GeoJSON coordinates that follow actual roads
    const response = await fetch(url);
    const data = await response.json();
    console.log('🚗 OSRM Response code:', data.code);

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // Always select the shortest route by distance for accuracy
      const route = data.routes.reduce((shortest: any, current: any) =>
        current.distance < shortest.distance ? current : shortest
      );
      console.log(
        `🚗 Selected shortest route: ${(route.distance / 1000).toFixed(1)} km (from ${
          data.routes.length
        } available routes)`
      );

      // Extract coordinates from GeoJSON (OSRM returns [lng, lat], we need {latitude, longitude})
      let coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

      // Ensure route starts exactly at pickup and ends exactly at drop for perfect alignment
      const startPoint = { latitude: startLat, longitude: startLng };
      const endPoint = { latitude: endLat, longitude: endLng };

      // Check if first coordinate is close to start point (within ~10 meters)
      const firstCoord = coordinates[0];
      const distanceToStart =
        Math.abs(firstCoord.latitude - startLat) + Math.abs(firstCoord.longitude - startLng);
      if (distanceToStart > 0.0001) {
        // Prepend exact start point
        coordinates = [startPoint, ...coordinates];
      }

      // Check if last coordinate is close to end point (within ~10 meters)
      const lastCoord = coordinates[coordinates.length - 1];
      const distanceToEnd =
        Math.abs(lastCoord.latitude - endLat) + Math.abs(lastCoord.longitude - endLng);
      if (distanceToEnd > 0.0001) {
        // Append exact end point
        coordinates = [...coordinates, endPoint];
      }

      console.log('🚗 Route coordinates count:', coordinates.length);

      // Calculate distance and duration
      const distanceKm = (route.distance / 1000).toFixed(1);
      const durationMins = Math.ceil(route.duration / 60);

      const info: RouteInfo = {
        distance: `${distanceKm} km`,
        duration: `${durationMins} min`,
      };

      console.log('🚗 Route info:', distanceKm, 'km,', durationMins, 'min');

      return { coordinates, info };
    } else {
      console.log('⚠️ OSRM error:', data.code, data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Route fetch error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ROUTE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Format distance in meters to human-readable string
 */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km >= 1) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${mins} min`;
}
