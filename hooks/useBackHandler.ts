/**
 * useBackHandler Hook
 * Android hardware back button handler for drawers
 *
 * Uses activeDrawer state machine:
 * - Handles back navigation based on current drawer
 * - Uses returnToPreviousDrawer for cancel/details flows
 * - navigateToDrawer(null) returns to "Choose Your Ride"
 */

import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useRideStore } from '@/store/rideStore';

export function useBackHandler() {
  const {
    activeDrawer,
    isLocationModalOpen,
    navigateToDrawer,
    closeLocationModal,
    returnToPreviousDrawer,
    returnToDrawer,
  } = useRideStore();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If location modal is open, close it first
      if (isLocationModalOpen) {
        closeLocationModal();
        return true;
      }

      // Handle back based on active drawer
      switch (activeDrawer) {
        case 'tier':
        case 'booking':
          // Return to "Choose Your Ride"
          navigateToDrawer(null);
          return true;

        case 'cancelReasons':
        case 'cancelConfirm':
        case 'rideDetails':
          // Return to previous drawer (waiting or rideBooked)
          if (returnToDrawer) {
            returnToPreviousDrawer();
            return true;
          }
          // Fallback to Choose Your Ride if no return drawer
          navigateToDrawer(null);
          return true;

        case 'waiting':
        case 'rideBooked':
          // These are "sticky" drawers - can't back out of a ride in progress
          // Just consume the back press to prevent app exit
          return true;

        default:
          // No drawer open, allow default back behavior
          return false;
      }
    });

    return () => backHandler.remove();
  }, [
    activeDrawer,
    isLocationModalOpen,
    navigateToDrawer,
    closeLocationModal,
    returnToPreviousDrawer,
    returnToDrawer,
  ]);
}
