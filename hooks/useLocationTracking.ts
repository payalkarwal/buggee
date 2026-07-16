/**
 * useLocationTracking Hook
 * Manages GPS location tracking, permissions, and region updates
 */

import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationCoordinates, MapRegion } from '@/types/ride';
import { getCurrentLocation, watchPosition, requestLocationPermission } from '@/services/locationService';

interface UseLocationTrackingReturn {
  userLocation: LocationCoordinates | null;
  region: MapRegion;
  liveTracking: boolean;
  isLocationModalVisible: boolean;
  selectedLocation: string | null;
  isLoadingLocation: boolean;
  setRegion: (region: MapRegion) => void;
  setLiveTracking: (tracking: boolean) => void;
  setLocationModalVisible: (visible: boolean) => void;
  setSelectedLocation: (location: string | null) => void;
  startTracking: () => void;
  fetchCurrentLocation: () => Promise<void>;
}

export function useLocationTracking(
  mapRef: React.RefObject<any>
): UseLocationTrackingReturn {
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [region, setRegion] = useState<MapRegion>({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });
  const [liveTracking, setLiveTracking] = useState(false);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const centeredOnceRef = useRef(false);

  // Load saved location and check permissions on mount
  useEffect(() => {
    const loadLocation = async () => {
      try {
        // Load saved location
        const savedLocation = await AsyncStorage.getItem('userLocation');
        if (savedLocation) setSelectedLocation(savedLocation);

        // Check current permission status
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status === 'granted') {
          // Permission already granted, start tracking
          setLiveTracking(true);
          await AsyncStorage.setItem('locationPermissionGranted', 'true');
        } else {
          // Permission not granted, show modal
          setTimeout(() => setLocationModalVisible(true), 500);
        }
      } catch (error) {
        console.log('Location load error:', error);
        // On error, show modal to be safe
        setTimeout(() => setLocationModalVisible(true), 500);
      }
    };
    loadLocation();
  }, []);

  // Live GPS tracking
  useEffect(() => {
    if (!liveTracking) return;

    let subscription: Location.LocationSubscription | null = null;

    const startWatch = async () => {
      centeredOnceRef.current = false;

      // Get immediate location first to center the map quickly
      try {
        const coords = await getCurrentLocation();
        if (coords) {
          setUserLocation(coords);
          setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
          mapRef.current?.animateToRegion(
            { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
            800
          );
          centeredOnceRef.current = true;
        }
      } catch (e) {
        console.log('Initial location fetch error:', e);
      }

      // Then start watching for updates
      subscription = await watchPosition((coords) => {
        setUserLocation(coords);
        if (!centeredOnceRef.current) {
          centeredOnceRef.current = true;
          mapRef.current?.animateToRegion(
            { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
            900
          );
        }
      });
    };

    startWatch();
    return () => {
      subscription?.remove();
    };
  }, [liveTracking, mapRef]);

  // Fetch current location (for button press)
  const fetchCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const hasServices = await Location.hasServicesEnabledAsync();
      if (!hasServices) {
        console.log('Location services are disabled');
        setIsLoadingLocation(false);
        return;
      }

      const coords = await getCurrentLocation();
      if (coords) {
        setUserLocation(coords);
        setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        mapRef.current?.animateToRegion(
          { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          1000
        );
      }
    } catch (error) {
      console.log('Fetch location error:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const startTracking = () => {
    setLiveTracking(true);
    setLocationModalVisible(false);
  };

  return {
    userLocation,
    region,
    liveTracking,
    isLocationModalVisible,
    selectedLocation,
    isLoadingLocation,
    setRegion,
    setLiveTracking,
    setLocationModalVisible,
    setSelectedLocation,
    startTracking,
    fetchCurrentLocation,
  };
}
