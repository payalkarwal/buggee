/**
 * useRideTimer Hook
 * Manages 12-second ride booking timer with pause/resume capability
 * Auto-transitions to Ride Booked drawer when timer completes
 *
 * Uses activeDrawer state machine:
 * - Timer runs when activeDrawer === 'waiting'
 * - Timer pauses when activeDrawer === 'cancelReasons' or 'cancelConfirm'
 * - Timer resets when transitioning to rideBooked
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
    activeDrawer,
    timerPaused,
    remainingTime,
    setTimerPaused,
    setRemainingTime,
  } = useRideStore();

  // Derived states from activeDrawer
  const isWaiting = activeDrawer === 'waiting';
  const isInCancelFlow = activeDrawer === 'cancelReasons' || activeDrawer === 'cancelConfirm';

  // Pause/Resume timer when entering/leaving cancel flow
  useEffect(() => {
    if (isInCancelFlow) {
      // Pause timer when in cancel flow
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
    } else if (timerPaused && isWaiting) {
      // Resume timer when returning to waiting from cancel flow
      setTimerPaused(false);
    }
  }, [isInCancelFlow, isWaiting, timerPaused, remainingTime, setTimerPaused, setRemainingTime]);

  // Auto-transition to Ride Booked drawer after timer completes
  useEffect(() => {
    if (isWaiting && !timerPaused) {
      timerStartTimeRef.current = Date.now();

      rideBookingTimerRef.current = setTimeout(() => {
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
  }, [isWaiting, timerPaused, remainingTime, onTimerComplete, setRemainingTime]);
}
