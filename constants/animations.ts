/**
 * Animation Constants
 * Centralized animation configurations for consistent UX
 */

import { Dimensions, Easing } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════
// DRAWER HEIGHTS
// ═══════════════════════════════════════════════════════════════════

export const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.55;
export const DRAWER_HEIGHT_LARGE = SCREEN_HEIGHT * 0.65;
export const DRAWER_HEIGHT_SMALL = SCREEN_HEIGHT * 0.45;

// ═══════════════════════════════════════════════════════════════════
// SPRING ANIMATION CONFIGS
// ═══════════════════════════════════════════════════════════════════

export const SPRING_CONFIG_OPEN = {
  tension: 50,
  friction: 12,
  useNativeDriver: true,
} as const;

export const SPRING_CONFIG_CLOSE = {
  tension: 55,
  friction: 14,
  useNativeDriver: true,
} as const;

// ═══════════════════════════════════════════════════════════════════
// TIMING (FADE) ANIMATION CONFIGS
// ═══════════════════════════════════════════════════════════════════

export const FADE_IN_CONFIG = {
  toValue: 1,
  duration: 350,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: true,
} as const;

export const FADE_OUT_CONFIG = {
  toValue: 0,
  duration: 300,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: true,
} as const;

// ═══════════════════════════════════════════════════════════════════
// OTHER ANIMATION TIMINGS
// ═══════════════════════════════════════════════════════════════════

export const RIDE_SECTION_SLIDE_UP_DELAY = 100; // ms delay before ride section slides up
export const PULSE_ANIMATION_DURATION = 1500; // Duration for pulse/ripple effects
export const BOUNCE_ANIMATION_DURATION = 800; // Duration for bounce animations

// Delay before drawer slides up (allows "Choose Your Ride" to slide down first)
export const DRAWER_OPEN_DELAY = 200; // ms
