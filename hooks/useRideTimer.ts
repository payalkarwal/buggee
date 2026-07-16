/**
 * useRideTimer Hook
 * Manages 12-second ride booking timer with pause/resume capability
 * Auto-transitions to Ride Booked drawer when timer completes
 */

import { useRef, useEffect } from 'react';
import { useRideStore } from '@/store/rideStore';

const DEFAULT_TIMER_DURATION = 12000; // 12 seconds in ms

interface UseRideTimerParams {
  onTimerComplete: () => void;
}

export function useRideTimer({ onTimerComplete }: UseRideTimerParams) {
  const rideBookingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerStartTimeRef = useRef<number | null>(null);

  const {
    isWaitingDrawerOpen,
    isRideBookedDrawerOpen,
    isCancelReasonsDrawerOpen,
    isCancelConfirmDrawerOpen,
    timerPaused,
    remainingTime,
    setTimerPaused,
    setRemainingTime,
  } = useRideStore();

  // Pause/Resume timer when cancel drawers open/close
  useEffect(() => {
    if (isCancelReasonsDrawerOpen || isCancelConfirmDrawerOpen) {
      // Pause timer
      if (rideBookingTimerRef.current && !timerPaused) {
        clearTimeout(rideBookingTimerRef.current);
        rideBookingTimerRef.current = null;

        // Calculate remaining time
        if (timerStartTimeRef.current) {
          const elapsed = Date.now() - timerStartTimeRef.current;
          const remaining = Math.max(0, remainingTime - elapsed);
          setRemainingTime(remaining);
        }
        setTimerPaused(true);
      }
    } else if (timerPaused && isWaitingDrawerOpen && !isRideBookedDrawerOpen) {
      // Resume timer
      setTimerPaused(false);
    }
  }, [
    isCancelReasonsDrawerOpen,
    isCancelConfirmDrawerOpen,
    isWaitingDrawerOpen,
    isRideBookedDrawerOpen,
    timerPaused,
    remainingTime,
    setTimerPaused,
    setRemainingTime,
  ]);

  // Auto-transition to Ride Booked drawer after timer completes
  useEffect(() => {
    if (isWaitingDrawerOpen && !isRideBookedDrawerOpen && !timerPaused) {
      timerStartTimeRef.current = Date.now();

      rideBookingTimerRef.current = setTimeout(() => {
        // Trigger callback to open ride booked drawer
        onTimerComplete();
        rideBookingTimerRef.current = null;
        setRemainingTime(DEFAULT_TIMER_DURATION); // Reset for next ride
      }, remainingTime);

      return () => {
        if (rideBookingTimerRef.current) {
          clearTimeout(rideBookingTimerRef.current);
          rideBookingTimerRef.current = null;
        }
      };
    }
  }, [
    isWaitingDrawerOpen,
    isRideBookedDrawerOpen,
    timerPaused,
    remainingTime,
    onTimerComplete,
    setRemainingTime,
  ]);
}
