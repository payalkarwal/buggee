/**
 * Haptic Feedback Service
 * Centralized haptic feedback for consistent UX across the app
 */

import * as Haptics from 'expo-haptics';

// ═══════════════════════════════════════════════════════════════════
// IMPACT HAPTICS
// ═══════════════════════════════════════════════════════════════════

/**
 * Light impact - for subtle interactions
 * Use for: button taps, list selections, minor UI changes
 */
export function lightImpact() {
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Medium impact - for important actions
 * Use for: drawer open/close, mode switches
 */
export function mediumImpact() {
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy impact - for critical actions
 * Use for: errors, warnings
 */
export function heavyImpact() {
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION HAPTICS
// ═══════════════════════════════════════════════════════════════════

/**
 * Success notification - for successful actions
 * Use for: ride booked, payment confirmed
 */
export function successNotification() {
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Warning notification - for caution actions
 * Use for: cancellations, warnings
 */
export function warningNotification() {
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Error notification - for errors
 * Use for: failed actions, validation errors
 */
export function errorNotification() {
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

// ═══════════════════════════════════════════════════════════════════
// SELECTION HAPTIC
// ═══════════════════════════════════════════════════════════════════

/**
 * Selection changed - for picker/selector interactions
 * Use for: tier selection, toggle switches
 */
export function selectionChanged() {
  return Haptics.selectionAsync();
}
