/**
 * Cancel Reasons
 * Predefined cancellation reasons for ride booking
 */

export interface CancelReason {
  id: string;
  text: string;
  icon: string; // Ionicons name
}

export const CANCEL_REASONS: CancelReason[] = [
  {
    id: 'driver-far',
    text: 'Driver is too far',
    icon: 'time-outline',
  },
  {
    id: 'changed-mind',
    text: 'Changed my mind',
    icon: 'refresh-outline',
  },
  {
    id: 'wrong-location',
    text: 'Wrong pickup location',
    icon: 'location-outline',
  },
  {
    id: 'price-high',
    text: 'Price is too high',
    icon: 'pricetag-outline',
  },
  {
    id: 'other',
    text: 'Other reason',
    icon: 'ellipsis-horizontal-outline',
  },
];
