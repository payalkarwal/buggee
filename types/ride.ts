export type TierType = 'Standard' | 'Delux' | 'VIP';
export type PaymentMethod = 'cash' | 'card';
export type LocationType = 'pickup' | 'drop';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface TierLocations {
  Standard: { pickup: string; drop: string };
  Delux: { pickup: string; drop: string };
  VIP: { pickup: string; drop: string };
}

export interface Place {
  id: string;
  name: string;
  address: string;
  distance: string;
  lat?: string;
  lon?: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
}

export interface DriverDetails {
  name: string;
  rating: number;
  trips: number;
  photo: string | null;
  car: {
    model: string;
    color: string;
    plateNumber: string;
  };
}

export interface BookedRide {
  tier: TierType;
  pickup: string;
  drop: string;
  price: string;
}

// ═══════════════════════════════════════════════════════════════════
// DRAWER & UI STATE TYPES
// ═══════════════════════════════════════════════════════════════════

export type DrawerType =
  | 'tier'
  | 'booking'
  | 'location'
  | 'waiting'
  | 'rideBooked'
  | 'rideDetails'
  | 'cancelReasons'
  | 'cancelConfirm'
  | 'confirmation';

export interface DrawerStates {
  tier: boolean;
  booking: boolean;
  location: boolean;
  waiting: boolean;
  rideBooked: boolean;
  rideDetails: boolean;
  cancelReasons: boolean;
  cancelConfirm: boolean;
  confirmation: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// REGION & MAP TYPES
// ═══════════════════════════════════════════════════════════════════

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
