/**
 * useBackHandler Hook
 * Android hardware back button handler for drawers
 */

import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useRideStore } from '@/store/rideStore';

export function useBackHandler() {
  const { isDrawerOpen, isBookingDrawerOpen, closeDrawer } = useRideStore();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If tier drawer is open, close it and return to "Choose Your Ride"
      if (isDrawerOpen) {
        closeDrawer('tier');
        return true; // Prevent default back behavior
      }

      // If booking drawer is open, close it and return to "Choose Your Ride"
      if (isBookingDrawerOpen) {
        closeDrawer('booking');
        return true; // Prevent default back behavior
      }

      // Allow default back behavior (no drawer is open)
      return false;
    });

    return () => backHandler.remove();
  }, [isDrawerOpen, isBookingDrawerOpen, closeDrawer]);
}
