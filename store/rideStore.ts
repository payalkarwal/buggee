/**
 * Ride Store - Zustand
 * Centralized state management for the ride booking flow
 * Eliminates 50+ useState calls from index.tsx
 */

import { create } from 'zustand';
import type {
  TierType,
  TierLocations,
  LocationCoordinates,
  RouteInfo,
  BookedRide,
  DriverDetails,
  Place,
  PaymentMethod,
  LocationType,
  DrawerType,
} from '@/types/ride';

interface RideStore {
  // ═══════════════════════════════════════════════════════════════════
  // TIER SELECTION STATE
  // ═══════════════════════════════════════════════════════════════════
  selectedTier: TierType | null;
  tierLocations: TierLocations;

  setSelectedTier: (tier: TierType | null) => void;
  setTierLocation: (tier: TierType, type: LocationType, value: string) => void;
  getTierLocation: (tier: TierType, type: LocationType) => string;

  // ═══════════════════════════════════════════════════════════════════
  // ROUTE & MAP STATE
  // ═══════════════════════════════════════════════════════════════════
  pickupCoords: LocationCoordinates | null;
  dropCoords: LocationCoordinates | null;
  routeCoordinates: LocationCoordinates[];
  routeInfo: RouteInfo | null;
  isLoadingRoute: boolean;

  setPickupCoords: (coords: LocationCoordinates | null) => void;
  setDropCoords: (coords: LocationCoordinates | null) => void;
  setRouteCoordinates: (coords: LocationCoordinates[]) => void;
  setRouteInfo: (info: RouteInfo | null) => void;
  setIsLoadingRoute: (loading: boolean) => void;
  clearRoute: () => void;

  // ═══════════════════════════════════════════════════════════════════
  // DRAWER STATES (9 drawers)
  // ═══════════════════════════════════════════════════════════════════
  isDrawerOpen: boolean; // tier selection
  isBookingDrawerOpen: boolean;
  isConfirmationDrawerOpen: boolean;
  isLocationDrawerOpen: boolean;
  isWaitingDrawerOpen: boolean;
  isRideDetailsDrawerOpen: boolean;
  isCancelReasonsDrawerOpen: boolean;
  isCancelConfirmDrawerOpen: boolean;
  isRideBookedDrawerOpen: boolean;

  openDrawer: (type: DrawerType) => void;
  closeDrawer: (type: DrawerType) => void;
  closeAllDrawers: () => void;

  // ═══════════════════════════════════════════════════════════════════
  // BOOKING & RIDE STATE
  // ═══════════════════════════════════════════════════════════════════
  bookedRide: BookedRide | null;
  driverDetails: DriverDetails | null;
  rideOTP: string;
  driverArrivalMins: number;

  setBookedRide: (ride: BookedRide | null) => void;
  setDriverDetails: (details: DriverDetails | null) => void;
  setRideOTP: (otp: string) => void;
  setDriverArrivalMins: (mins: number) => void;

  // ═══════════════════════════════════════════════════════════════════
  // UI & PREFERENCES STATE
  // ═══════════════════════════════════════════════════════════════════
  selectedPaymentMethod: PaymentMethod;
  shareTripEnabled: boolean;

  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  setShareTripEnabled: (enabled: boolean) => void;

  // ═══════════════════════════════════════════════════════════════════
  // LOCATION SEARCH STATE
  // ═══════════════════════════════════════════════════════════════════
  locationSelectionType: LocationType;
  locationSearchQuery: string;
  searchResults: Place[];
  isSearching: boolean;

  setLocationSelectionType: (type: LocationType) => void;
  setLocationSearchQuery: (query: string) => void;
  setSearchResults: (results: Place[]) => void;
  setIsSearching: (searching: boolean) => void;
  clearSearch: () => void;

  // ═══════════════════════════════════════════════════════════════════
  // TIMER STATE
  // ═══════════════════════════════════════════════════════════════════
  remainingTime: number;
  timerPaused: boolean;

  setRemainingTime: (time: number) => void;
  setTimerPaused: (paused: boolean) => void;
  resetTimer: () => void;

  // ═══════════════════════════════════════════════════════════════════
  // CANCEL STATE
  // ═══════════════════════════════════════════════════════════════════
  selectedCancelReason: string | null;
  showCustomReasonInput: boolean;
  customReason: string;
  cancelInitiatedFrom: 'waiting' | 'booked' | null;
  rideDetailsOpenedFrom: 'waiting' | 'booked' | null;

  setSelectedCancelReason: (reason: string | null) => void;
  setShowCustomReasonInput: (show: boolean) => void;
  setCustomReason: (reason: string) => void;
  setCancelInitiatedFrom: (from: 'waiting' | 'booked' | null) => void;
  setRideDetailsOpenedFrom: (from: 'waiting' | 'booked' | null) => void;
  resetCancelState: () => void;

  // ═══════════════════════════════════════════════════════════════════
  // GLOBAL RESET
  // ═══════════════════════════════════════════════════════════════════
  resetRideState: () => void;
}

const DEFAULT_TIMER_DURATION = 12000; // 12 seconds in ms

export const useRideStore = create<RideStore>((set, get) => ({
  // ═══════════════════════════════════════════════════════════════════
  // TIER SELECTION - Initial State
  // ═══════════════════════════════════════════════════════════════════
  selectedTier: null,
  tierLocations: {
    Standard: { pickup: '', drop: '' },
    Delux: { pickup: '', drop: '' },
    VIP: { pickup: '', drop: '' },
  },

  setSelectedTier: (tier) => set({ selectedTier: tier }),

  setTierLocation: (tier, type, value) => {
    set((state) => ({
      tierLocations: {
        ...state.tierLocations,
        [tier]: {
          ...state.tierLocations[tier],
          [type]: value,
        },
      },
    }));
  },

  getTierLocation: (tier, type) => {
    const { tierLocations } = get();
    return tierLocations[tier][type];
  },

  // ═══════════════════════════════════════════════════════════════════
  // ROUTE & MAP - Initial State
  // ═══════════════════════════════════════════════════════════════════
  pickupCoords: null,
  dropCoords: null,
  routeCoordinates: [],
  routeInfo: null,
  isLoadingRoute: false,

  setPickupCoords: (coords) => set({ pickupCoords: coords }),
  setDropCoords: (coords) => set({ dropCoords: coords }),
  setRouteCoordinates: (coords) => set({ routeCoordinates: coords }),
  setRouteInfo: (info) => set({ routeInfo: info }),
  setIsLoadingRoute: (loading) => set({ isLoadingRoute: loading }),

  clearRoute: () =>
    set({
      routeCoordinates: [],
      routeInfo: null,
      isLoadingRoute: false,
    }),

  // ═══════════════════════════════════════════════════════════════════
  // DRAWER STATES - Initial State (all closed)
  // ═══════════════════════════════════════════════════════════════════
  isDrawerOpen: false,
  isBookingDrawerOpen: false,
  isConfirmationDrawerOpen: false,
  isLocationDrawerOpen: false,
  isWaitingDrawerOpen: false,
  isRideDetailsDrawerOpen: false,
  isCancelReasonsDrawerOpen: false,
  isCancelConfirmDrawerOpen: false,
  isRideBookedDrawerOpen: false,

  openDrawer: (type) => {
    const drawerMap: Record<DrawerType, keyof RideStore> = {
      tier: 'isDrawerOpen',
      booking: 'isBookingDrawerOpen',
      confirmation: 'isConfirmationDrawerOpen',
      location: 'isLocationDrawerOpen',
      waiting: 'isWaitingDrawerOpen',
      rideDetails: 'isRideDetailsDrawerOpen',
      cancelReasons: 'isCancelReasonsDrawerOpen',
      cancelConfirm: 'isCancelConfirmDrawerOpen',
      rideBooked: 'isRideBookedDrawerOpen',
    };

    // Close all drawers first, then open the requested one
    // This ensures only one drawer is visible at a time
    set({
      isDrawerOpen: false,
      isBookingDrawerOpen: false,
      isConfirmationDrawerOpen: false,
      isLocationDrawerOpen: false,
      isWaitingDrawerOpen: false,
      isRideDetailsDrawerOpen: false,
      isCancelReasonsDrawerOpen: false,
      isCancelConfirmDrawerOpen: false,
      isRideBookedDrawerOpen: false,
      [drawerMap[type]]: true,
    });
  },

  closeDrawer: (type) => {
    const drawerMap: Record<DrawerType, keyof RideStore> = {
      tier: 'isDrawerOpen',
      booking: 'isBookingDrawerOpen',
      confirmation: 'isConfirmationDrawerOpen',
      location: 'isLocationDrawerOpen',
      waiting: 'isWaitingDrawerOpen',
      rideDetails: 'isRideDetailsDrawerOpen',
      cancelReasons: 'isCancelReasonsDrawerOpen',
      cancelConfirm: 'isCancelConfirmDrawerOpen',
      rideBooked: 'isRideBookedDrawerOpen',
    };

    set({ [drawerMap[type]]: false });
  },

  closeAllDrawers: () =>
    set({
      isDrawerOpen: false,
      isBookingDrawerOpen: false,
      isConfirmationDrawerOpen: false,
      isLocationDrawerOpen: false,
      isWaitingDrawerOpen: false,
      isRideDetailsDrawerOpen: false,
      isCancelReasonsDrawerOpen: false,
      isCancelConfirmDrawerOpen: false,
      isRideBookedDrawerOpen: false,
    }),

  // ═══════════════════════════════════════════════════════════════════
  // BOOKING & RIDE - Initial State
  // ═══════════════════════════════════════════════════════════════════
  bookedRide: null,
  driverDetails: null,
  rideOTP: '4829', // Mock OTP
  driverArrivalMins: 5,

  setBookedRide: (ride) => set({ bookedRide: ride }),
  setDriverDetails: (details) => set({ driverDetails: details }),
  setRideOTP: (otp) => set({ rideOTP: otp }),
  setDriverArrivalMins: (mins) => set({ driverArrivalMins: mins }),

  // ═══════════════════════════════════════════════════════════════════
  // UI & PREFERENCES - Initial State
  // ═══════════════════════════════════════════════════════════════════
  selectedPaymentMethod: 'cash',
  shareTripEnabled: false,

  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
  setShareTripEnabled: (enabled) => set({ shareTripEnabled: enabled }),

  // ═══════════════════════════════════════════════════════════════════
  // LOCATION SEARCH - Initial State
  // ═══════════════════════════════════════════════════════════════════
  locationSelectionType: 'pickup',
  locationSearchQuery: '',
  searchResults: [],
  isSearching: false,

  setLocationSelectionType: (type) => set({ locationSelectionType: type }),
  setLocationSearchQuery: (query) => set({ locationSearchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (searching) => set({ isSearching: searching }),

  clearSearch: () =>
    set({
      locationSearchQuery: '',
      searchResults: [],
      isSearching: false,
    }),

  // ═══════════════════════════════════════════════════════════════════
  // TIMER - Initial State
  // ═══════════════════════════════════════════════════════════════════
  remainingTime: DEFAULT_TIMER_DURATION,
  timerPaused: false,

  setRemainingTime: (time) => set({ remainingTime: time }),
  setTimerPaused: (paused) => set({ timerPaused: paused }),

  resetTimer: () =>
    set({
      remainingTime: DEFAULT_TIMER_DURATION,
      timerPaused: false,
    }),

  // ═══════════════════════════════════════════════════════════════════
  // CANCEL STATE - Initial State
  // ═══════════════════════════════════════════════════════════════════
  selectedCancelReason: null,
  showCustomReasonInput: false,
  customReason: '',
  cancelInitiatedFrom: null,
  rideDetailsOpenedFrom: null,

  setSelectedCancelReason: (reason) => set({ selectedCancelReason: reason }),
  setShowCustomReasonInput: (show) => set({ showCustomReasonInput: show }),
  setCustomReason: (reason) => set({ customReason: reason }),
  setCancelInitiatedFrom: (from) => set({ cancelInitiatedFrom: from }),
  setRideDetailsOpenedFrom: (from) => set({ rideDetailsOpenedFrom: from }),

  resetCancelState: () =>
    set({
      selectedCancelReason: null,
      showCustomReasonInput: false,
      customReason: '',
      cancelInitiatedFrom: null,
      rideDetailsOpenedFrom: null,
    }),

  // ═══════════════════════════════════════════════════════════════════
  // GLOBAL RESET
  // ═══════════════════════════════════════════════════════════════════
  resetRideState: () =>
    set({
      // Reset tier selection
      selectedTier: null,
      tierLocations: {
        Standard: { pickup: '', drop: '' },
        Delux: { pickup: '', drop: '' },
        VIP: { pickup: '', drop: '' },
      },

      // Reset route
      pickupCoords: null,
      dropCoords: null,
      routeCoordinates: [],
      routeInfo: null,
      isLoadingRoute: false,

      // Close all drawers
      isDrawerOpen: false,
      isBookingDrawerOpen: false,
      isConfirmationDrawerOpen: false,
      isLocationDrawerOpen: false,
      isWaitingDrawerOpen: false,
      isRideDetailsDrawerOpen: false,
      isCancelReasonsDrawerOpen: false,
      isCancelConfirmDrawerOpen: false,
      isRideBookedDrawerOpen: false,

      // Reset booking
      bookedRide: null,
      driverDetails: null,

      // Reset UI prefs
      selectedPaymentMethod: 'cash',
      shareTripEnabled: false,

      // Reset search
      locationSearchQuery: '',
      searchResults: [],
      isSearching: false,

      // Reset timer
      remainingTime: DEFAULT_TIMER_DURATION,
      timerPaused: false,

      // Reset cancel
      selectedCancelReason: null,
      showCustomReasonInput: false,
      customReason: '',
      cancelInitiatedFrom: null,
      rideDetailsOpenedFrom: null,
    }),
}));
