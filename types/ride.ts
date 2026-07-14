export type TierType = 'Standard' | 'Delux' | 'VIP';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
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
