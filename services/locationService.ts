/**
 * Location Service
 * Handles GPS tracking, reverse geocoding, and location search
 */

import * as Location from 'expo-location';
import type { LocationCoordinates, Place } from '@/types/ride';

const LOCATIONIQ_API_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY;

// ═══════════════════════════════════════════════════════════════════
// REVERSE GEOCODING
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert coordinates to human-readable address using LocationIQ API
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json`
    );
    const data = await response.json();

    if (data.error) {
      console.log('Reverse geocode error:', data.error);
      return null;
    }

    // Get a readable location name
    const address = data.address || {};
    const name =
      address.road ||
      address.neighbourhood ||
      address.suburb ||
      address.city ||
      address.state ||
      'Your Location';
    const area = address.suburb || address.neighbourhood || address.city || '';

    return area ? `${name}, ${area}` : name;
  } catch (error) {
    console.log('Reverse geocode error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// LOCATION SEARCH (AUTOCOMPLETE)
// ═══════════════════════════════════════════════════════════════════

/**
 * Search for locations using LocationIQ Autocomplete API
 * Returns formatted Place objects
 */
export async function searchLocations(query: string): Promise<Place[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  try {
    // Use LocationIQ Autocomplete API
    const response = await fetch(
      `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
        query
      )}&limit=8&countrycodes=in&dedupe=1`
    );
    const data = await response.json();

    // Handle API errors
    if (data.error) {
      console.log('LocationIQ error:', data.error);
      return [];
    }

    const results: Place[] = data.map((item: any, index: number) => ({
      id: item.place_id?.toString() || index.toString(),
      name: item.display_place || item.display_name?.split(',')[0] || 'Unknown',
      address: item.display_address || item.display_name || '',
      distance: '',
      lat: item.lat,
      lon: item.lon,
    }));

    return results;
  } catch (error) {
    console.log('Search error:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// GPS LOCATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Request location permissions from the user
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Permission request error:', error);
    return false;
  }
}

/**
 * Get current GPS location
 */
export async function getCurrentLocation(): Promise<LocationCoordinates | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.log('Get location error:', error);
    return null;
  }
}

/**
 * Start watching user's location in real-time
 * Returns a subscription that should be removed when done
 */
export async function watchPosition(
  callback: (location: LocationCoordinates) => void
): Promise<Location.LocationSubscription | null> {
  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000, // Update every 3 seconds
        distanceInterval: 10, // Or when moved 10 meters
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.log('Watch position error:', error);
    return null;
  }
}
