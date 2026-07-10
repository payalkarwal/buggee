import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView as SafeAreaContextView, useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomTabBar from '@/components/navigation/CustomTabBar';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Drawer height configurations - 55% of screen for main drawers
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.55;
const DRAWER_HEIGHT_LARGE = SCREEN_HEIGHT * 0.65;
const DRAWER_HEIGHT_SMALL = SCREEN_HEIGHT * 0.45;

const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#F5F5F5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F5F5F5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#BDBDBD' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#EAEAEA' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#EEEEEE' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#DADADA' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9C9C9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9E9E9E' }] },
];

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1C1C24' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8E8E93' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1C1C24' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2C2C35' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#22222A' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#24242E' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1C2D24' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2D2D38' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3A3A4D' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#22222A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1A2840' }] },
];

const tierDetails = {
  Standard: {
    name: 'Standard',
    icon: 'car-side' as const,
    color: '#FF4F8B',
    desc: 'Comfortable, budget-friendly everyday rides.',
    detailDesc: 'Perfect for daily commuting or quick solo trips. Safe, clean, and extremely budget-friendly hatchbacks with professional drivers.',
    price: '₹ 49',
    eta: '4 mins away',
    rating: '4.8',
    capacity: '4 seats',
  },
  Delux: {
    name: 'Delux',
    icon: 'car-sports' as const,
    color: '#FF4F8B',
    desc: 'Premium comfort and extra space.',
    detailDesc: 'Enjoy a premium travel experience in spacious, high-end sedans. Features top-rated drivers, extra legroom, and dual-zone climate control.',
    price: '₹ 79',
    eta: '2 mins away',
    rating: '4.9',
    capacity: '4 seats',
  },
  VIP: {
    name: 'VIP',
    icon: 'crown' as const,
    color: '#FF4F8B',
    desc: 'Elite luxury experience with top chauffeurs.',
    detailDesc: 'Ride in first-class luxury. Our elite tier features high-end premium SUVs, noise-canceling cabin, complimentary refreshments, and priority route dispatch.',
    price: '₹ 129',
    eta: '1 min away',
    rating: '5.0',
    capacity: '6 seats',
  },
};

const NEARBY_PLACES = [
  { id: '1', name: '5/127, Block 17', address: 'Block 5, Subhash Nagar, Delhi', distance: '34 km', lat: '28.6421', lon: '77.1156' },
  { id: '2', name: 'Gurgaon Railway Station Parking', address: 'Kheri, Ashok Vihar, Sector 3, Gurugram, Haryana', distance: '16 km', lat: '28.4595', lon: '77.0266' },
  { id: '3', name: 'Jagannath Community College (JCC)', address: 'Community Center, Plot No. 2 & 3, Sector 3, Rohini', distance: '43 km', lat: '28.7041', lon: '77.1025' },
  { id: '4', name: 'Centrum Plaza', address: 'Golf Course Rd, near ILM Institute, Sector 53', distance: '3.3 km', lat: '28.4437', lon: '77.1028' },
  { id: '5', name: 'Huda City Centre Metro', address: 'Huda City Centre, Sector 29, New Delhi', distance: '7.5 km', lat: '28.4594', lon: '77.0724' },
  { id: '6', name: 'Netaji Subhash Place Metro Station', address: 'Ring Rd, Near D Mall, Netaji Subhash Place', distance: '42 km', lat: '28.6969', lon: '77.1537' },
];


export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const returnedPickup = params.pickup as string | undefined;
  const returnedDrop = params.drop as string | undefined;
  const returnedTier = params.tier as string | undefined;

  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  const mapRef = useRef<MapView>(null);

  // ── Precise location pin state ──
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string>('');
  const [liveTracking, setLiveTracking] = useState(false);
  const centeredOnceRef = useRef(false); // first fix pe ek baar auto-center
  const reverseGeocodedRef = useRef(false); // track if we've already reverse geocoded

  const [selectedTier, setSelectedTier] = useState<'Standard' | 'Delux' | 'VIP' | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [isConfirmationDrawerOpen, setIsConfirmationDrawerOpen] = useState(false);
  // Tier-specific locations
  const [tierLocations, setTierLocations] = useState<{
    Standard: { pickup: string; drop: string };
    Delux: { pickup: string; drop: string };
    VIP: { pickup: string; drop: string };
  }>({
    Standard: { pickup: '', drop: '' },
    Delux: { pickup: '', drop: '' },
    VIP: { pickup: '', drop: '' },
  });

  // Get current tier's locations
  const currentPickup = selectedTier ? tierLocations[selectedTier].pickup : '';
  const currentDrop = selectedTier ? tierLocations[selectedTier].drop : '';
  const [isLocationDrawerOpen, setIsLocationDrawerOpen] = useState(false);
  const [locationSelectionType, setLocationSelectionType] = useState<'pickup' | 'drop'>('pickup');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; address: string; distance: string; lat?: string; lon?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rideBookingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(12000);
  const timerStartTimeRef = useRef<number | null>(null);
  const [isWaitingDrawerOpen, setIsWaitingDrawerOpen] = useState(false);
  const [isRideDetailsDrawerOpen, setIsRideDetailsDrawerOpen] = useState(false);
  const [isCancelReasonsDrawerOpen, setIsCancelReasonsDrawerOpen] = useState(false);
  const [isCancelConfirmDrawerOpen, setIsCancelConfirmDrawerOpen] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string | null>(null);
  const [showCustomReasonInput, setShowCustomReasonInput] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [shareTripEnabled, setShareTripEnabled] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isRideBookedDrawerOpen, setIsRideBookedDrawerOpen] = useState(false);
  const [driverArrivalMins, setDriverArrivalMins] = useState(5);
  const [rideOTP] = useState('4829');
  const [cancelInitiatedFrom, setCancelInitiatedFrom] = useState<'waiting' | 'booked' | null>(null);
  const [rideDetailsOpenedFrom, setRideDetailsOpenedFrom] = useState<'waiting' | 'booked' | null>(null);
  const [driverDetails] = useState({
    name: 'Rajesh Kumar',
    rating: 4.8,
    trips: 1247,
    photo: null,
    car: {
      model: 'Maruti Swift Dzire',
      color: 'White',
      plateNumber: 'DL 4C AB 1234',
    }
  });

  // Store booked ride details (persists across drawer transitions)
  const [bookedRide, setBookedRide] = useState<{
    tier: 'Standard' | 'Delux' | 'VIP';
    pickup: string;
    drop: string;
    price: string;
  } | null>(null);

  // ── Route and coordinates state ──
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const drawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const drawerFadeAnim = useRef(new Animated.Value(0)).current;
  const bookingDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bookingDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const confirmationDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const confirmationDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const locationDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const locationDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const waitingDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const waitingDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const waitingPulseAnim = useRef(new Animated.Value(1)).current;
  const waitingRippleAnim = useRef(new Animated.Value(0)).current;
  const rideDetailsDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const rideDetailsDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const cancelReasonsDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const cancelReasonsDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const cancelConfirmDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const cancelConfirmDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const rideBookedDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const rideBookedDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const tabBarAnim = useRef(new Animated.Value(1)).current;
  const rideSectionSlideAnim = useRef(new Animated.Value(500)).current;

  const openDrawer = (tier: 'Standard' | 'Delux' | 'VIP') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTier(tier);
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 12,
        useNativeDriver: true
      }),
      Animated.timing(drawerFadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      // Hide "Choose Your Ride" section when tier drawer opens
      Animated.timing(rideSectionSlideAnim, {
        toValue: 600,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start();
  };

  const openBookingDrawer = (tier: 'Standard' | 'Delux' | 'VIP') => {
    // If tier details drawer is open, close it first before opening booking drawer
    if (isDrawerOpen) {
      closeDrawer();
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedTier(tier);
        setIsBookingDrawerOpen(true);
        Animated.parallel([
          Animated.spring(bookingDrawerSlideAnim, {
            toValue: 0,
            tension: 50,
            friction: 12,
            useNativeDriver: true
          }),
          Animated.timing(bookingDrawerFadeAnim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.timing(tabBarAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          // Hide "Choose Your Ride" section
          Animated.timing(rideSectionSlideAnim, {
            toValue: 600,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
        ]).start();
      }, 350); // Delay to allow tier drawer to close (300ms animation + 50ms buffer)
    } else {
      // No drawer open, open booking drawer directly
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedTier(tier);
      setIsBookingDrawerOpen(true);
      Animated.parallel([
        Animated.spring(bookingDrawerSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 12,
          useNativeDriver: true
        }),
        Animated.timing(bookingDrawerFadeAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(tabBarAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        // Hide "Choose Your Ride" section
        Animated.timing(rideSectionSlideAnim, {
          toValue: 600,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        }),
      ]).start();
    }
  };

  const closeDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(drawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 14,
        useNativeDriver: true
      }),
      Animated.timing(drawerFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      // Slide "Choose Your Ride" section back up when tier drawer closes
      Animated.spring(rideSectionSlideAnim, {
        toValue: 0,
        tension: 35,
        friction: 10,
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsDrawerOpen(false);
      setSelectedTier(null);
    });
  };

  const closeBookingDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(bookingDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 14,
        useNativeDriver: true
      }),
      Animated.timing(bookingDrawerFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      // Show "Choose Your Ride" section when drawer closes (back button)
      Animated.spring(rideSectionSlideAnim, {
        toValue: 0,
        tension: 35,
        friction: 10,
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsBookingDrawerOpen(false);
      setSelectedTier(null);
    });
  };

  const openConfirmationDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsConfirmationDrawerOpen(true);
    Animated.parallel([
      Animated.spring(confirmationDrawerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 12,
        useNativeDriver: true
      }),
      Animated.timing(confirmationDrawerFadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start();
  };

  const closeConfirmationDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(confirmationDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 14,
        useNativeDriver: true
      }),
      Animated.timing(confirmationDrawerFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsConfirmationDrawerOpen(false);
    });
  };

  const openLocationDrawer = (type: 'pickup' | 'drop') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocationSelectionType(type);
    setIsLocationDrawerOpen(true);
    Animated.parallel([
      Animated.spring(locationDrawerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 12,
        useNativeDriver: true
      }),
      Animated.timing(locationDrawerFadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start();
  };

  const closeLocationDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(locationDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 14,
        useNativeDriver: true
      }),
      Animated.timing(locationDrawerFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsLocationDrawerOpen(false);
    });
  };

  const openWaitingDrawer = () => {
    // If booking drawer is open, close it first (without showing Choose Your Ride)
    if (isBookingDrawerOpen) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.spring(bookingDrawerSlideAnim, {
          toValue: SCREEN_HEIGHT,
          tension: 55,
          friction: 14,
          useNativeDriver: true
        }),
        Animated.timing(bookingDrawerFadeAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(tabBarAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        // Keep "Choose Your Ride" hidden during transition
      ]).start(() => {
        setIsBookingDrawerOpen(false);
        setSelectedTier(null);
      });

      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsWaitingDrawerOpen(true);
        setRemainingTime(12000); // Reset timer for new ride
        setTimerPaused(false);
        Animated.parallel([
          Animated.spring(waitingDrawerSlideAnim, {
            toValue: 0,
            tension: 50,
            friction: 12,
            useNativeDriver: true
          }),
          Animated.timing(waitingDrawerFadeAnim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
        ]).start();
      }, 350); // Delay to allow booking drawer to close
    } else {
      // No drawer open, open waiting drawer directly
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsWaitingDrawerOpen(true);
      setRemainingTime(12000); // Reset timer for new ride
      setTimerPaused(false);
      Animated.parallel([
        Animated.spring(waitingDrawerSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 12,
          useNativeDriver: true
        }),
        Animated.timing(waitingDrawerFadeAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
      ]).start();
    }
  };

  const closeWaitingDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(waitingDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 14,
        useNativeDriver: true
      }),
      Animated.timing(waitingDrawerFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsWaitingDrawerOpen(false);
    });
  };

  const openRideDetailsDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRideDetailsDrawerOpen(true);
    Animated.parallel([
      Animated.spring(rideDetailsDrawerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 12,
        useNativeDriver: true
      }),
      Animated.timing(rideDetailsDrawerFadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start();
  };

  const closeRideDetailsDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(rideDetailsDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 14,
        useNativeDriver: true
      }),
      Animated.timing(rideDetailsDrawerFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsRideDetailsDrawerOpen(false);
    });
  };

  const openCancelReasonsDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCancelReasonsDrawerOpen(true);
    Animated.parallel([
      Animated.spring(cancelReasonsDrawerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 12,
        useNativeDriver: true
      }),
      Animated.timing(cancelReasonsDrawerFadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start();
  };

  const closeCancelReasonsDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(cancelReasonsDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 14,
        useNativeDriver: true
      }),
      Animated.timing(cancelReasonsDrawerFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsCancelReasonsDrawerOpen(false);
      setShowCustomReasonInput(false);
      setCustomReason('');
    });
  };

  const openCancelConfirmDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCancelConfirmDrawerOpen(true);
    Animated.parallel([
      Animated.spring(cancelConfirmDrawerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 12,
        useNativeDriver: true
      }),
      Animated.timing(cancelConfirmDrawerFadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start();
  };

  const closeCancelConfirmDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(cancelConfirmDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 14,
        useNativeDriver: true
      }),
      Animated.timing(cancelConfirmDrawerFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsCancelConfirmDrawerOpen(false);
    });
  };

  const openRideBookedDrawer = () => {
    // If waiting drawer is open, close it first
    if (isWaitingDrawerOpen) {
      closeWaitingDrawer();
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsRideBookedDrawerOpen(true);
        // Generate random arrival time between 3-8 mins
        setDriverArrivalMins(Math.floor(Math.random() * 6) + 3);
        Animated.parallel([
          Animated.spring(rideBookedDrawerSlideAnim, {
            toValue: 0,
            tension: 50,
            friction: 12,
            useNativeDriver: true
          }),
          Animated.timing(rideBookedDrawerFadeAnim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
        ]).start();
      }, 350); // Delay to allow waiting drawer to close
    } else {
      // No drawer open, open ride booked drawer directly
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsRideBookedDrawerOpen(true);
      // Generate random arrival time between 3-8 mins
      setDriverArrivalMins(Math.floor(Math.random() * 6) + 3);
      Animated.parallel([
        Animated.spring(rideBookedDrawerSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 12,
          useNativeDriver: true
        }),
        Animated.timing(rideBookedDrawerFadeAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
      ]).start();
    }
  };

  const closeRideBookedDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(rideBookedDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 14,
        useNativeDriver: true
      }),
      Animated.timing(rideBookedDrawerFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsRideBookedDrawerOpen(false);
    });
  };

  const handleCancelReasonSelect = (reason: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCancelReason(reason);

    // Clear custom reason input when selecting a different reason
    setShowCustomReasonInput(false);
    setCustomReason('');
    Keyboard.dismiss();

    closeCancelReasonsDrawer();
    setTimeout(() => openCancelConfirmDrawer(), 300);
  };

  const handleConfirmCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Clear the ride booking timer to prevent auto-transition to Ride Booked drawer
    if (rideBookingTimerRef.current) {
      clearTimeout(rideBookingTimerRef.current);
      rideBookingTimerRef.current = null;
    }

    // Close all ride-related drawers
    closeCancelConfirmDrawer();
    closeRideDetailsDrawer();
    closeWaitingDrawer();
    closeRideBookedDrawer();

    // Reset all ride-related state
    setSelectedCancelReason(null);
    setBookedRide(null);
    setShareTripEnabled(false);
    setCancelInitiatedFrom(null);
    setRemainingTime(12000); // Reset timer
    setTimerPaused(false);
    clearRoute(); // Clear the route from map
  };

  const handleWaitForDriver = () => {
    closeCancelConfirmDrawer();
    closeRideDetailsDrawer();
    setCancelInitiatedFrom(null);
  };

  const handleSelectPlace = (place: { id: string; name: string; address: string; distance: string; lat?: string; lon?: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!selectedTier) return;

    console.log('📍 Selected place:', place.name, 'lat:', place.lat, 'lon:', place.lon);

    // Update tier-specific location
    setTierLocations(prev => ({
      ...prev,
      [selectedTier]: {
        ...prev[selectedTier],
        [locationSelectionType]: place.name,
      }
    }));

    // Store coordinates for routing
    if (place.lat && place.lon) {
      const coords = {
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
      };
      console.log('📍 Setting', locationSelectionType, 'coords:', coords);
      if (locationSelectionType === 'pickup') {
        setPickupCoords(coords);
      } else {
        setDropCoords(coords);
      }
    } else {
      console.log('⚠️ No coordinates for place:', place.name);
    }
    // Don't close the drawer - let user select both locations
  };

  // LocationIQ API
  const LOCATIONIQ_API_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY;

  // Reverse geocode to get location name from coordinates
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();

      if (data.error) {
        console.log('Reverse geocode error:', data.error);
        return null;
      }

      // Get a readable location name
      const address = data.address || {};
      const name = address.road || address.neighbourhood || address.suburb || address.city || address.state || 'Your Location';
      const area = address.suburb || address.neighbourhood || address.city || '';

      return area ? `${name}, ${area}` : name;
    } catch (error) {
      console.log('Reverse geocode error:', error);
      return null;
    }
  };

  // Update pickup location with actual location name when user location changes
  useEffect(() => {
    const updateLocationName = async () => {
      if (userLocation && !reverseGeocodedRef.current) {
        reverseGeocodedRef.current = true;
        const locationName = await reverseGeocode(userLocation.latitude, userLocation.longitude);
        if (locationName) {
          setCurrentLocationName(locationName);
          // Update all tiers with the actual location name (only if pickup is empty)
          setTierLocations(prev => ({
            Standard: { ...prev.Standard, pickup: prev.Standard.pickup === '' ? locationName : prev.Standard.pickup },
            Delux: { ...prev.Delux, pickup: prev.Delux.pickup === '' ? locationName : prev.Delux.pickup },
            VIP: { ...prev.VIP, pickup: prev.VIP.pickup === '' ? locationName : prev.VIP.pickup },
          }));
          // Set pickup coordinates from user's current location
          setPickupCoords({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          });
        }
      }
    };
    updateLocationName();
  }, [userLocation]);

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use LocationIQ Autocomplete API
      const response = await fetch(
        `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&limit=8&countrycodes=in&dedupe=1`
      );
      const data = await response.json();

      // Handle API errors
      if (data.error) {
        console.log('LocationIQ error:', data.error);
        setSearchResults([]);
        return;
      }

      const results = data.map((item: any, index: number) => ({
        id: item.place_id?.toString() || index.toString(),
        name: item.display_place || item.display_name?.split(',')[0] || 'Unknown',
        address: item.display_address || item.display_name || '',
        distance: '',
        lat: item.lat,
        lon: item.lon,
      }));

      setSearchResults(results);
    } catch (error) {
      console.log('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationInputChange = (type: 'pickup' | 'drop', value: string) => {
    if (!selectedTier) return;
    setLocationSearchQuery(value);
    setTierLocations(prev => ({
      ...prev,
      [selectedTier]: {
        ...prev[selectedTier],
        [type]: value,
      }
    }));

    // Debounced search - 400ms (between 300-500ms for optimal UX)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 400);
  };

  // Combined places: API results + fallback to NEARBY_PLACES
  const displayPlaces = locationSearchQuery.trim().length >= 2
    ? searchResults
    : NEARBY_PLACES;

  const handleDoneSelectingLocations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocationSearchQuery('');
    setSearchResults([]);
    closeLocationDrawer();
  };

  // ══════════════════════════════════════════════════════════════════════
  // OSRM ROUTING - Fetch route that follows roads and streets
  // ══════════════════════════════════════════════════════════════════════
  const fetchRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ) => {
    setIsLoadingRoute(true);
    // Request multiple alternative routes from OSRM
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true`;
    console.log('🚗 OSRM URL:', url);

    try {
      // OSRM API - Returns GeoJSON coordinates that follow actual roads
      const response = await fetch(url);
      const data = await response.json();
      console.log('🚗 OSRM Response code:', data.code);

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // Always select the shortest route by distance for accuracy
        const route = data.routes.reduce((shortest: any, current: any) =>
          current.distance < shortest.distance ? current : shortest
        );
        console.log(`🚗 Selected shortest route: ${(route.distance / 1000).toFixed(1)} km (from ${data.routes.length} available routes)`);

        // Extract coordinates from GeoJSON (OSRM returns [lng, lat], we need {latitude, longitude})
        let coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));

        // Ensure route starts exactly at pickup and ends exactly at drop for perfect alignment
        const startPoint = { latitude: startLat, longitude: startLng };
        const endPoint = { latitude: endLat, longitude: endLng };

        // Check if first coordinate is close to start point (within ~10 meters)
        const firstCoord = coordinates[0];
        const distanceToStart = Math.abs(firstCoord.latitude - startLat) + Math.abs(firstCoord.longitude - startLng);
        if (distanceToStart > 0.0001) {
          // Prepend exact start point
          coordinates = [startPoint, ...coordinates];
        }

        // Check if last coordinate is close to end point (within ~10 meters)
        const lastCoord = coordinates[coordinates.length - 1];
        const distanceToEnd = Math.abs(lastCoord.latitude - endLat) + Math.abs(lastCoord.longitude - endLng);
        if (distanceToEnd > 0.0001) {
          // Append exact end point
          coordinates = [...coordinates, endPoint];
        }

        console.log('🚗 Route coordinates count:', coordinates.length);
        setRouteCoordinates(coordinates);

        // Calculate distance and duration
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMins = Math.ceil(route.duration / 60);
        setRouteInfo({
          distance: `${distanceKm} km`,
          duration: `${durationMins} min`,
        });
        console.log('🚗 Route info:', distanceKm, 'km,', durationMins, 'min');

        // Fit map to show the entire route
        if (mapRef.current && coordinates.length > 0) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
            animated: true,
          });
        }
      } else {
        console.log('⚠️ OSRM error:', data.code, data.message);
      }
    } catch (error) {
      console.log('❌ Route fetch error:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Clear route and coordinates
  const clearRoute = () => {
    setRouteCoordinates([]);
    setPickupCoords(null);
    setDropCoords(null);
    setRouteInfo(null);
  };

  // Fetch route when both pickup and drop coordinates are set
  // Automatically recalculates whenever pickup or destination changes
  useEffect(() => {
    console.log('🗺️ Route useEffect - pickup:', pickupCoords, 'drop:', dropCoords);
    if (pickupCoords && dropCoords) {
      console.log('🚗 Fetching route...');
      fetchRoute(
        pickupCoords.latitude,
        pickupCoords.longitude,
        dropCoords.latitude,
        dropCoords.longitude
      );
    }
  }, [pickupCoords, dropCoords]);

  const modalSlideAnim = useRef(new Animated.Value(500)).current;
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const markerPulseAnim = useRef(new Animated.Value(1)).current;
  const markerRippleAnim = useRef(new Animated.Value(0)).current;
  const markerBounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const ripple = Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(rippleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    ripple.start();

    return () => { pulse.stop(); ripple.stop(); };
  }, []);

  // Marker animations - smooth and professional
  useEffect(() => {
    if (userLocation) {
      // Initial bounce animation when marker appears
      Animated.sequence([
        Animated.spring(markerBounceAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous subtle pulse
      const markerPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(markerPulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
          Animated.timing(markerPulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      );
      markerPulse.start();

      // Continuous ripple effect
      const markerRipple = Animated.loop(
        Animated.sequence([
          Animated.timing(markerRippleAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(markerRippleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      markerRipple.start();

      return () => {
        markerPulse.stop();
        markerRipple.stop();
      };
    }
  }, [userLocation]);

  useEffect(() => {
    if (isLocationModalVisible) {
      modalSlideAnim.setValue(500);
      modalFadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(modalFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.spring(modalSlideAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true
        }),
      ]).start();
    }
  }, [isLocationModalVisible]);

  const closeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(modalSlideAnim, {
        toValue: 500,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
    ]).start(() => setLocationModalVisible(false));
  };

  useEffect(() => {
    const loadLocation = async () => {
      try {
        // Load saved location
        const savedLocation = await AsyncStorage.getItem('userLocation');
        if (savedLocation) setSelectedLocation(savedLocation);

        // Check current permission status
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status === 'granted') {
          // Permission already granted, start tracking
          setLiveTracking(true);
          await AsyncStorage.setItem('locationPermissionGranted', 'true');
        } else {
          // Permission not granted, show modal
          setTimeout(() => setLocationModalVisible(true), 500);
        }
      } catch (error) {
        console.log('Location load error:', error);
        // On error, show modal to be safe
        setTimeout(() => setLocationModalVisible(true), 500);
      }
    };
    loadLocation();
  }, []);

  // Slide-up animation for Choose Your Ride section
  useEffect(() => {
    Animated.spring(rideSectionSlideAnim, {
      toValue: 0,
      tension: 35,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  // Waiting drawer animations
  useEffect(() => {
    if (isWaitingDrawerOpen) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(waitingPulseAnim, { toValue: 1.15, duration: 1400, useNativeDriver: true }),
          Animated.timing(waitingPulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ])
      );
      pulse.start();

      const ripple = Animated.loop(
        Animated.sequence([
          Animated.timing(waitingRippleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(waitingRippleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      ripple.start();

      return () => {
        pulse.stop();
        ripple.stop();
      };
    }
  }, [isWaitingDrawerOpen]);

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
  }, [isCancelReasonsDrawerOpen, isCancelConfirmDrawerOpen, isWaitingDrawerOpen, isRideBookedDrawerOpen, timerPaused, remainingTime]);

  // Auto-transition to Ride Booked drawer after timer completes
  useEffect(() => {
    if (isWaitingDrawerOpen && !isRideBookedDrawerOpen && !timerPaused) {
      timerStartTimeRef.current = Date.now();

      rideBookingTimerRef.current = setTimeout(() => {
        // openRideBookedDrawer will automatically close waiting drawer first
        openRideBookedDrawer();
        rideBookingTimerRef.current = null;
        setRemainingTime(12000); // Reset for next ride
      }, remainingTime);

      return () => {
        if (rideBookingTimerRef.current) {
          clearTimeout(rideBookingTimerRef.current);
          rideBookingTimerRef.current = null;
        }
      };
    }
  }, [isWaitingDrawerOpen, isRideBookedDrawerOpen, timerPaused, remainingTime]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If tier drawer is open, close it and return to "Choose Your Ride"
      if (isDrawerOpen) {
        closeDrawer();
        return true; // Prevent default back behavior
      }

      // If booking drawer is open, close it and return to "Choose Your Ride"
      if (isBookingDrawerOpen) {
        closeBookingDrawer();
        return true; // Prevent default back behavior
      }

      // Allow default back behavior (no drawer is open)
      return false;
    });

    return () => backHandler.remove();
  }, [isDrawerOpen, isBookingDrawerOpen]);

  // Show/Hide "Choose Your Ride" section based on drawer states
  useEffect(() => {
    const allDrawersClosed = !isBookingDrawerOpen && !isWaitingDrawerOpen && !isRideBookedDrawerOpen;

    if (allDrawersClosed) {
      // Show "Choose Your Ride" section
      Animated.timing(rideSectionSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    }
    // Note: Hiding is handled in openBookingDrawer function
  }, [isBookingDrawerOpen, isWaitingDrawerOpen, isRideBookedDrawerOpen]);

  // ── LIVE precise GPS — pin exact spot pe rehta hai aur move pe update hota hai ──
  // NOTE: Real precision sirf physical device pe milti hai (simulator fake/0 deta hai).
  useEffect(() => {
    if (!liveTracking) return;
    let posSub: Location.LocationSubscription | null = null;

    const startWatch = async () => {
      reverseGeocodedRef.current = false;
      centeredOnceRef.current = false;

      // Get immediate location first to center the map quickly
      try {
        const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude };
        setUserLocation(coords);
        setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 800);
        centeredOnceRef.current = true;
      } catch (e) {
        console.log('Initial location fetch error:', e);
      }

      // Then start watching for updates
      posSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
        (loc) => {
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLocation(coords);
          if (!centeredOnceRef.current) {
            centeredOnceRef.current = true;
            mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 900);
          }
        }
      );
    };

    startWatch();
    return () => { posSub?.remove(); };
  }, [liveTracking]);

  const fetchCurrentLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoadingLocation(true);
    try {
      const hasServices = await Location.hasServicesEnabledAsync();
      if (!hasServices) {
        Alert.alert('Location Disabled', 'Please enable location services in your device settings.');
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission denied. Please enable it in settings.');
        return;
      }
      // HIGH accuracy = precise pickup spot
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      const newRegion = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };

      setRegion(newRegion);
      setUserLocation(coords);
      centeredOnceRef.current = true;
      setLiveTracking(true);
      setTimeout(() => mapRef.current?.animateToRegion(newRegion, 1000), 300);

      const [address] = await Location.reverseGeocodeAsync(coords);

      if (address) {
        const locationString =
          address.city || address.subregion || address.district || address.region || 'Unknown Location';
        const parts = [address.name, address.street, address.district, address.city, address.region].filter(Boolean);
        const fullAddr = parts.join(', ');
        setSelectedLocation(locationString);
        await AsyncStorage.setItem('userLocation', locationString);
        await AsyncStorage.setItem('userFullAddress', fullAddr);
        await AsyncStorage.setItem('locationPermissionGranted', 'true');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        closeModal();
      } else {
        Alert.alert('Error', 'Could not determine address. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not fetch location. Make sure GPS is turned on and try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Recenter hamesha precise pin pe (stale region pe nahi)
  const handleRecenter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = userLocation ?? region;
    mapRef.current?.animateToRegion(
      { latitude: target.latitude, longitude: target.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      600
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FULL SCREEN MAP                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        customMapStyle={isDark ? darkMapStyle : lightMapStyle}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
        rotateEnabled
        pitchEnabled
      >
        {/* Current user location marker — Blue dot */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
            zIndex={2}
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
            </View>
          </Marker>
        )}

        {/* Route Polyline - follows actual roads via OSRM */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#FF4F8B"
            strokeWidth={4}
          />
        )}

        {/* Pickup Marker - Premium 3D circular badge design */}
        {pickupCoords && (
          <Marker
            coordinate={pickupCoords}
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
            zIndex={3}
          >
            <View style={styles.pickupMarkerContainer}>
              {/* Outer glow/shadow layer */}
              <View style={styles.pickupMarkerGlow} />
              {/* Main circular badge */}
              <View style={styles.pickupMarkerBadge}>
                {/* Inner circle */}
                <View style={styles.pickupMarkerInner}>
                  <View style={styles.pickupMarkerDot} />
                </View>
              </View>
              {/* Bottom shadow for 3D depth */}
              <View style={styles.pickupMarkerShadow} />
            </View>
          </Marker>
        )}

        {/* Drop Marker - Premium 3D pin/teardrop design */}
        {dropCoords && (
          <Marker
            coordinate={dropCoords}
            anchor={{ x: 0.5, y: 1 }}
            centerOffset={{ x: 0, y: -2 }}
            zIndex={3}
          >
            <View style={styles.dropMarkerContainer}>
              {/* Pin body - teardrop shape */}
              <View style={styles.dropMarkerPin}>
                {/* White border ring */}
                <View style={styles.dropMarkerBorder}>
                  {/* Red fill */}
                  <View style={styles.dropMarkerFill}>
                    {/* Icon inside */}
                    <Ionicons name="location" size={20} color="#FFF" />
                  </View>
                </View>
                {/* Pin point/tail */}
                <View style={styles.dropMarkerTail} />
              </View>
              {/* Ground shadow for 3D effect */}
              <View style={styles.dropMarkerShadow} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header overlay */}
      <SafeAreaContextView
        edges={['top']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        pointerEvents="box-none"
      >
        <View style={styles.floatingHeaderCard}>
          {/* Buggee Logo — top left */}
          <View style={[styles.logoContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoImg}
              contentFit="cover"
            />
          </View>

          {/* Notification button — top right */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(ROUTES.NOTIFICATIONS);
            }}
            style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          >
            <Ionicons name="notifications-outline" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Route Info - Below header, smaller size */}
        {routeInfo && (
          <View style={[styles.routeInfoCardSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="navigate" size={14} color={colors.accent} />
            <Text style={[styles.routeInfoTextSmall, { color: colors.text }]}>{routeInfo.distance}</Text>
            <View style={[styles.routeInfoDividerSmall, { backgroundColor: colors.border }]} />
            <Ionicons name="time" size={14} color={colors.accent} />
            <Text style={[styles.routeInfoTextSmall, { color: colors.text }]}>{routeInfo.duration}</Text>
          </View>
        )}
      </SafeAreaContextView>

      {/* Recenter FAB - fixed on map, just above drawer (Uber/Rapido style) */}
      <TouchableOpacity
        style={[styles.mapRecenterFab, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleRecenter}
        activeOpacity={0.7}
      >
        <Ionicons name="locate" size={26} color={colors.accent} />
      </TouchableOpacity>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM HALF - Floating Booking Card with Slide Animation            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={[
          styles.bottomHalf,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            transform: [{ translateY: rideSectionSlideAnim }]
          }
        ]}
      >
        {/* Drag Handle */}
        <View style={[styles.bottomHalfHandle, { backgroundColor: colors.border }]} />

        {/* Floating Booking Card */}
        <View style={styles.floatingBookingCard}>
          <View style={styles.bookingCardHeader}>
            <Text style={[styles.bookingSectionTitle, { color: colors.text }]}>Choose Your Ride</Text>
          </View>

          {/* Standard */}
          <View style={styles.bookingRowClean}>
            <TouchableOpacity
              style={styles.bookingLeft}
              activeOpacity={0.7}
              onPress={() => openDrawer('Standard')}
            >
              <MaterialCommunityIcons name="car-side" size={32} color={isDark ? "#FFFFFF" : "#000000"} style={{ width: 36, marginRight: 16 }} />
              <View style={styles.tierInfo}>
                <View style={styles.tierNameRow}>
                  <Text style={[styles.tierName, { color: colors.text }]}>Standard</Text>
                  <TouchableOpacity onPress={() => openDrawer('Standard')} activeOpacity={0.6}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.textSub} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.tierDesc, { color: colors.textSub }]}>Comfortable & affordable</Text>
                <Text style={[styles.tierPrice, { color: colors.accent }]}>₹ 49 <Text style={[styles.tierPriceUnit, { color: colors.textSub }]}>/km</Text></Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookBtn, { backgroundColor: colors.accent }]}
              onPress={() => openBookingDrawer('Standard')}
              activeOpacity={0.85}
            >
              <Text style={[styles.bookBtnText, { color: '#000' }]}>Book</Text>
              <Ionicons name="arrow-forward" size={15} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

          {/* Delux */}
          <View style={styles.bookingRowClean}>
            <TouchableOpacity
              style={styles.bookingLeft}
              activeOpacity={0.7}
              onPress={() => openDrawer('Delux')}
            >
              <MaterialCommunityIcons name="car-sports" size={32} color={isDark ? "#FFFFFF" : "#000000"} style={{ width: 36, marginRight: 16 }} />
              <View style={styles.tierInfo}>
                <View style={styles.tierNameRow}>
                  <Text style={[styles.tierName, { color: colors.text }]}>Delux</Text>
                  <TouchableOpacity onPress={() => openDrawer('Delux')} activeOpacity={0.6}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.textSub} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.tierDesc, { color: colors.textSub }]}>Premium comfort ride</Text>
                <Text style={[styles.tierPrice, { color: colors.accent }]}>₹ 79 <Text style={[styles.tierPriceUnit, { color: colors.textSub }]}>/km</Text></Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookBtn, { backgroundColor: colors.accent }]}
              onPress={() => openBookingDrawer('Delux')}
              activeOpacity={0.85}
            >
              <Text style={[styles.bookBtnText, { color: '#000' }]}>Book</Text>
              <Ionicons name="arrow-forward" size={15} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

          {/* VIP */}
          <View style={styles.bookingRowClean}>
            <TouchableOpacity
              style={styles.bookingLeft}
              activeOpacity={0.7}
              onPress={() => openDrawer('VIP')}
            >
              <MaterialCommunityIcons name="crown" size={32} color={isDark ? "#FFFFFF" : "#000000"} style={{ width: 36, marginRight: 16 }} />
              <View style={styles.tierInfo}>
                <View style={styles.tierNameRow}>
                  <Text style={[styles.tierName, { color: colors.text }]}>VIP</Text>
                  <TouchableOpacity onPress={() => openDrawer('VIP')} activeOpacity={0.6}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.textSub} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.tierDesc, { color: colors.textSub }]}>Luxury experience</Text>
                <Text style={[styles.tierPrice, { color: colors.accent }]}>₹ 129 <Text style={[styles.tierPriceUnit, { color: colors.textSub }]}>/km</Text></Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookBtn, { backgroundColor: colors.accent }]}
              onPress={() => openBookingDrawer('VIP')}
              activeOpacity={0.85}
            >
              <Text style={[styles.bookBtnText, { color: '#000' }]}>Book</Text>
              <Ionicons name="arrow-forward" size={15} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Custom Bottom Tab Bar Overlay */}
      <CustomTabBar activeTab="home" style={{ opacity: tabBarAnim }} />

      {/* Location Permission Bottom Sheet */}
      <Modal visible={isLocationModalVisible} animationType="none" transparent onRequestClose={closeModal}>
        <Animated.View style={[styles.modalOverlay, { backgroundColor: colors.overlay, opacity: modalFadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[styles.modalContent, { backgroundColor: colors.modalBg, borderColor: colors.border, transform: [{ translateY: modalSlideAnim }] }]}>
            {/* Handle bar */}
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            {/* Icon + glow */}
            <View style={styles.modalIconWrap}>
              <Animated.View style={[styles.modalIconRipple, {
                borderColor: colors.accent,
                transform: [{ scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.0] }) }],
                opacity: rippleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.08, 0] }),
              }]} />
              <Animated.View style={[styles.modalIconOuter, { backgroundColor: colors.accentDim, borderColor: colors.accentMid, transform: [{ scale: pulseAnim }] }]}>
                <View style={[styles.modalIconInner, { backgroundColor: colors.accent }]}>
                  <Ionicons name="location" size={34} color="#000" />
                </View>
              </Animated.View>
            </View>

            {/* Text */}
            <Text style={[styles.modalTitle, { color: colors.text }]}>Enable Location</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSub }]}>
              Allow access to find nearby drivers and get accurate ride estimates in real time.
            </Text>

            {/* Allow button */}
            <TouchableOpacity
              style={[styles.allowBtn, { backgroundColor: colors.accent }, isLoadingLocation && styles.allowBtnLoading]}
              onPress={fetchCurrentLocation}
              disabled={isLoadingLocation}
              activeOpacity={0.85}
            >
              {isLoadingLocation ? (
                <>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={[styles.allowBtnText, { color: '#000' }]}>Detecting location...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="navigate" size={20} color="#000" />
                  <Text style={[styles.allowBtnText, { color: '#000' }]}>Allow Current Location</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity onPress={closeModal} style={styles.skipBtn} activeOpacity={0.6}>
              <Text style={[styles.skipBtnText, { color: colors.textSub }]}>Not now</Text>
            </TouchableOpacity>

          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Booking Drawer - Floating Panel (no overlay, map stays interactive) */}
      {isDrawerOpen && (
        <>
          {/* Invisible backdrop - closes drawer if locations not selected */}
          {(!currentPickup || !currentDrop) && (
            <TouchableOpacity
              style={styles.invisibleBackdrop}
              activeOpacity={1}
              onPress={closeDrawer}
            />
          )}
          <Animated.View
            style={[
              styles.floatingDrawerContent,
              {
                backgroundColor: colors.modalBg,
                paddingBottom: Math.max(insets.bottom, 20),
                transform: [{ translateY: drawerSlideAnim }]
              }
            ]}
          >
            <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />
            {selectedTier && (() => {
              const details = tierDetails[selectedTier];
              return (
                <View style={styles.drawerInnerContainer}>
                  <View style={styles.drawerHeader}>
                    {/* Back Button */}
                    <TouchableOpacity
                      onPress={closeDrawer}
                      style={[styles.tierBackButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="arrow-back" size={20} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.drawerHeaderLeft}>
                      {selectedTier === 'Standard' && (
                        <MaterialCommunityIcons name="car-side" size={32} color={isDark ? "#FFFFFF" : "#000000"} style={{ width: 36, marginRight: 12 }} />
                      )}
                      {selectedTier === 'Delux' && (
                        <MaterialCommunityIcons name="car-sports" size={32} color={isDark ? "#FFFFFF" : "#000000"} style={{ width: 36, marginRight: 12 }} />
                      )}
                      {selectedTier === 'VIP' && (
                        <MaterialCommunityIcons name="crown" size={32} color={isDark ? "#FFFFFF" : "#000000"} style={{ width: 36, marginRight: 12 }} />
                      )}
                      <View style={styles.drawerHeaderText}>
                        <View style={styles.drawerHeaderTitleRow}>
                          <Text style={[styles.drawerTitle, { color: colors.accent }]}>{details.name}</Text>
                          {selectedTier === 'Delux' && (
                            <View style={[styles.popularBadge, { borderColor: colors.accentDim, backgroundColor: colors.accentDim, marginLeft: 8 }]}>
                              <Text style={[styles.popularBadgeText, { color: colors.text }]}>Popular</Text>
                            </View>
                          )}
                          {selectedTier === 'VIP' && (
                            <View style={[styles.vipBadge, { borderColor: colors.accentDim, marginLeft: 8 }]}>
                              <Ionicons name="star" size={10} color={colors.accent} />
                            </View>
                          )}
                        </View>
                        <Text style={[styles.drawerSubtitle, { color: colors.textSub }]}>{details.desc}</Text>
                      </View>
                    </View>
                  </View>

                  {/* About Section Only */}
                  <View style={[styles.drawerDetailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.drawerSummaryTitle, { color: colors.text }]}>About</Text>
                    <Text style={[styles.drawerDetailDescText, { color: colors.textSub }]}>{details.detailDesc}</Text>
                  </View>
                </View>
              );
            })()}
          </Animated.View>
        </>
      )}

      {/* Booking Drawer - Pickup/Drop Selection (Floating Panel) */}
      {isBookingDrawerOpen && (
        <Animated.View
          style={[
            styles.floatingBookingDrawerContent,
            {
              backgroundColor: colors.modalBg,
              paddingBottom: Math.max(insets.bottom, 20),
              transform: [{ translateY: bookingDrawerSlideAnim }]
            }
          ]}
        >
            <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />
            {selectedTier && (() => {
              const details = tierDetails[selectedTier];
              return (
                <View style={styles.drawerInnerContainer}>
                  {/* Back Button */}
                  <TouchableOpacity
                    onPress={closeBookingDrawer}
                    style={[styles.bookingBackButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                  </TouchableOpacity>

                  {/* Enhanced Ride Header with Gradient-like Effect */}
                  <View style={[styles.enhancedRideHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.rideHeaderTop}>
                      <View style={styles.rideIconContainer}>
                        <View style={[styles.rideIconOuter, { backgroundColor: colors.accentDim }]}>
                          {selectedTier === 'Standard' && (
                            <MaterialCommunityIcons name="car-side" size={32} color={colors.accent} />
                          )}
                          {selectedTier === 'Delux' && (
                            <MaterialCommunityIcons name="car-sports" size={32} color={colors.accent} />
                          )}
                          {selectedTier === 'VIP' && (
                            <MaterialCommunityIcons name="crown" size={32} color={colors.accent} />
                          )}
                        </View>
                      </View>
                      <View style={styles.rideHeaderInfo}>
                        <View style={styles.rideNameRow}>
                          <Text style={[styles.rideHeaderName, { color: colors.text }]}>{details.name}</Text>
                          {selectedTier === 'Delux' && (
                            <View style={[styles.popularTag, { backgroundColor: colors.accentDim }]}>
                              <Ionicons name="star" size={10} color={colors.accent} />
                              <Text style={[styles.popularTagText, { color: colors.accent }]}>Popular</Text>
                            </View>
                          )}
                          {selectedTier === 'VIP' && (
                            <View style={[styles.premiumTag, { backgroundColor: colors.accentDim }]}>
                              <Ionicons name="diamond" size={10} color={colors.accent} />
                              <Text style={[styles.premiumTagText, { color: colors.accent }]}>Premium</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.rideHeaderDesc, { color: colors.textSub }]}>{details.desc}</Text>
                        <View style={styles.ridePriceBadge}>
                          <Ionicons name="cash-outline" size={14} color={colors.accent} />
                          <Text style={[styles.ridePriceText, { color: colors.text }]}>{details.price}/km</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Simplified Location Section with Route Line */}
                  <View style={styles.simpleLocationsSection}>
                    {/* Pickup Location */}
                    <TouchableOpacity
                      style={styles.simpleLocationRow}
                      onPress={() => openLocationDrawer('pickup')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.simpleLocationLeft}>
                        <View style={[styles.simpleLocationDot, { backgroundColor: colors.accent }]} />
                        <View style={styles.simpleLocationTextWrap}>
                          <Text style={[styles.simpleLocationLabel, { color: colors.textSub }]}>Pickup location</Text>
                          <Text style={[styles.simpleLocationValue, { color: currentPickup ? colors.text : colors.textSub }]}>
                            {currentPickup || 'Enter pickup location'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
                    </TouchableOpacity>

                    {/* Visual Route Line */}
                    <View style={styles.simpleRouteLine}>
                      <View style={[styles.simpleRouteLinePath, { backgroundColor: colors.border }]} />
                    </View>

                    {/* Drop Location */}
                    <TouchableOpacity
                      style={styles.simpleLocationRow}
                      onPress={() => openLocationDrawer('drop')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.simpleLocationLeft}>
                        <View style={[styles.simpleLocationSquare, { borderColor: '#E53935' }]} />
                        <View style={styles.simpleLocationTextWrap}>
                          <Text style={[styles.simpleLocationLabel, { color: colors.textSub }]}>Drop off location</Text>
                          <Text style={[styles.simpleLocationValue, { color: currentDrop ? colors.text : colors.textSub }]}>
                            {currentDrop || 'Where to?'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
                    </TouchableOpacity>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: colors.accent, opacity: (currentPickup && currentDrop) ? 1 : 0.5 }]}
                    onPress={() => {
                      if (currentPickup && currentDrop && selectedTier) {
                        // Save booked ride details before closing drawer
                        setBookedRide({
                          tier: selectedTier,
                          pickup: currentPickup,
                          drop: currentDrop,
                          price: tierDetails[selectedTier].price,
                        });
                        // openWaitingDrawer will close booking drawer first, then open waiting drawer
                        openWaitingDrawer();
                      }
                    }}
                    disabled={!currentPickup || !currentDrop}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.continueButtonText, { color: '#000' }]}>Request Ride</Text>
                    <Ionicons name="arrow-forward" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              );
            })()}
          </Animated.View>
      )}

      {/* Location Selection Drawer - Full Screen */}
      <Modal visible={isLocationDrawerOpen} animationType="slide" onRequestClose={handleDoneSelectingLocations}>
        <View style={[styles.locationFullScreen, { backgroundColor: colors.modalBg }]}>
          {/* Header */}
          <SafeAreaContextView edges={['top']} style={{ backgroundColor: colors.modalBg }}>
            <View style={[styles.locationDrawerHeader, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={handleDoneSelectingLocations} style={[styles.locationBackButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.locationDrawerTitle, { color: colors.text }]}>
                Select Locations
              </Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaContextView>

          {/* Location Input Card */}
          <View style={[styles.locationInputCard, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: 16, marginTop: 16 }]}>
            {/* Pickup Input */}
            <TouchableOpacity
              style={[styles.locationInputRow, locationSelectionType === 'pickup' && { backgroundColor: colors.accentDim, borderRadius: 12, marginHorizontal: -8, paddingHorizontal: 8 }]}
              onPress={() => setLocationSelectionType('pickup')}
              activeOpacity={0.7}
            >
              <View style={styles.locationDotWrap}>
                <View style={[styles.locationDotOuter, { borderColor: colors.accent }]}>
                  <View style={[styles.locationDotInner, { backgroundColor: colors.accent }]} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationInputLabel, { color: colors.textSub }]}>Pickup</Text>
                <TextInput
                  style={[styles.locationTextInput, { color: colors.text }]}
                  value={currentPickup}
                  onChangeText={(text) => handleLocationInputChange('pickup', text)}
                  placeholder="Enter pickup location"
                  placeholderTextColor={colors.textSub}
                  onFocus={() => setLocationSelectionType('pickup')}
                />
              </View>
              {currentPickup ? (
                <TouchableOpacity
                  style={styles.clearInputBtn}
                  onPress={() => {
                    if (selectedTier) {
                      setTierLocations(prev => ({
                        ...prev,
                        [selectedTier]: { ...prev[selectedTier], pickup: '' }
                      }));
                      setLocationSearchQuery('');
                      setSearchResults([]);
                      setPickupCoords(null);
                      setRouteCoordinates([]);
                      setRouteInfo(null);
                    }
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSub} />
                </TouchableOpacity>
              ) : locationSelectionType === 'pickup' ? (
                <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />
              ) : null}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.locationInputDivider}>
              <View style={[styles.locationDividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Drop Input */}
            <TouchableOpacity
              style={[styles.locationInputRow, locationSelectionType === 'drop' && { backgroundColor: colors.accentDim, borderRadius: 12, marginHorizontal: -8, paddingHorizontal: 8 }]}
              onPress={() => setLocationSelectionType('drop')}
              activeOpacity={0.7}
            >
              <View style={styles.locationDotWrap}>
                <View style={[styles.locationSquare, { borderColor: '#E53935' }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationInputLabel, { color: colors.textSub }]}>Drop off</Text>
                <TextInput
                  style={[styles.locationTextInput, { color: currentDrop ? colors.text : colors.textSub }]}
                  value={currentDrop}
                  onChangeText={(text) => handleLocationInputChange('drop', text)}
                  placeholder="Where to?"
                  placeholderTextColor={colors.textSub}
                  onFocus={() => setLocationSelectionType('drop')}
                />
              </View>
              {currentDrop ? (
                <TouchableOpacity
                  style={styles.clearInputBtn}
                  onPress={() => {
                    if (selectedTier) {
                      setTierLocations(prev => ({
                        ...prev,
                        [selectedTier]: { ...prev[selectedTier], drop: '' }
                      }));
                      setLocationSearchQuery('');
                      setSearchResults([]);
                      setDropCoords(null);
                      setRouteCoordinates([]);
                      setRouteInfo(null);
                    }
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSub} />
                </TouchableOpacity>
              ) : locationSelectionType === 'drop' ? (
                <View style={[styles.activeIndicator, { backgroundColor: '#E53935' }]} />
              ) : null}
            </TouchableOpacity>
          </View>

          {/* Suggestions/Nearby Places List */}
          <FlatList
            data={displayPlaces}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            contentContainerStyle={[styles.nearbyPlacesList, { paddingHorizontal: 16 }]}
            ListHeaderComponent={
              <View style={styles.suggestionsHeaderWrap}>
                <Text style={[styles.suggestionsHeader, { color: colors.textSub }]}>
                  {isSearching ? 'Searching...' : (locationSearchQuery.trim().length >= 2 ? 'Search Results' : 'Nearby Places')}
                </Text>
                {isSearching && <ActivityIndicator size="small" color={colors.accent} />}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.noResultsWrap}>
                {isSearching ? (
                  <ActivityIndicator size="large" color={colors.accent} />
                ) : (
                  <>
                    <Ionicons name="search-outline" size={32} color={colors.textSub} />
                    <Text style={[styles.noResultsText, { color: colors.textSub }]}>
                      {locationSearchQuery.trim().length >= 2 ? 'No places found' : 'Start typing to search'}
                    </Text>
                  </>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.nearbyPlaceItem, { borderColor: colors.border }]}
                onPress={() => {
                  handleSelectPlace(item);
                  setLocationSearchQuery('');
                  setSearchResults([]);
                  Keyboard.dismiss();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.nearbyPlaceIcon, { backgroundColor: colors.surface }]}>
                  <Ionicons name="location-outline" size={20} color={colors.accent} />
                </View>
                <View style={styles.nearbyPlaceInfo}>
                  <Text style={[styles.nearbyPlaceName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.nearbyPlaceAddress, { color: colors.textSub }]} numberOfLines={2}>{item.address}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Fixed Confirm Button at Bottom */}
          <SafeAreaContextView edges={['bottom']} style={{ backgroundColor: colors.modalBg }}>
            <View style={[styles.locationConfirmWrap, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.locationConfirmBtn, { backgroundColor: colors.accent, opacity: (currentPickup && currentDrop) ? 1 : 0.5 }]}
                onPress={handleDoneSelectingLocations}
                disabled={!currentPickup || !currentDrop}
                activeOpacity={0.85}
              >
                <Text style={[styles.locationConfirmText, { color: '#000' }]}>Confirm Locations</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaContextView>
        </View>
      </Modal>

      {/* Waiting/Ride Requested Drawer - Floating Panel (map interactive) */}
      {isWaitingDrawerOpen && (
        <Animated.View
          style={[
            styles.floatingWaitingDrawer,
            {
              backgroundColor: colors.modalBg,
              paddingBottom: Math.max(insets.bottom, 20),
              transform: [{ translateY: waitingDrawerSlideAnim }]
            }
          ]}
        >
          <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />

            {/* Animated Loading Icon */}
            <View style={styles.waitingIconContainer}>
              <Animated.View style={[styles.waitingRipple, {
                borderColor: colors.accent,
                transform: [{ scale: waitingRippleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
                opacity: waitingRippleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.1, 0] }),
              }]} />
              <Animated.View style={[styles.waitingPulseOuter, { backgroundColor: colors.accentDim, transform: [{ scale: waitingPulseAnim }] }]}>
                <View style={[styles.waitingPulseInner, { backgroundColor: colors.accent }]}>
                  <MaterialCommunityIcons name="car-side" size={26} color="#000" />
                </View>
              </Animated.View>
            </View>

            {/* Header */}
            <View style={styles.waitingHeaderCenter}>
              <Text style={[styles.waitingTitle, { color: colors.text }]}>Ride Requested</Text>
              <Text style={[styles.waitingSubtitle, { color: colors.textSub }]}>Finding drivers nearby...</Text>
            </View>

            {/* Ride Details Card */}
            <View style={[styles.waitingDetailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Pickup */}
              <View style={styles.waitingDetailRow}>
                <View style={[styles.simpleLocationDot, { backgroundColor: colors.accent }]} />
                <View style={styles.waitingDetailTextWrap}>
                  <Text style={[styles.waitingDetailLabel, { color: colors.textSub }]}>PICKUP</Text>
                  <Text style={[styles.waitingDetailValue, { color: colors.text }]} numberOfLines={1}>{bookedRide?.pickup || 'Current Location'}</Text>
                </View>
              </View>

              <View style={styles.waitingRouteLine}>
                <View style={[styles.simpleRouteLinePath, { backgroundColor: colors.border }]} />
              </View>

              {/* Drop */}
              <View style={styles.waitingDetailRow}>
                <View style={[styles.simpleLocationSquare, { borderColor: '#E53935' }]} />
                <View style={styles.waitingDetailTextWrap}>
                  <Text style={[styles.waitingDetailLabel, { color: colors.textSub }]}>DROP-OFF</Text>
                  <Text style={[styles.waitingDetailValue, { color: colors.text }]} numberOfLines={1}>{bookedRide?.drop || 'Destination'}</Text>
                </View>
              </View>
            </View>

            {/* Buggee Promo Banner */}
            <View style={[styles.promoBanner, { backgroundColor: colors.accent }]}>
              <View style={styles.promoLeft}>
                <View style={styles.promoIconWrap}>
                  <Ionicons name="pricetag" size={20} color="#000" />
                </View>
                <View style={styles.promoTextWrap}>
                  <Text style={styles.promoTitle}>₹50 OFF on your first ride!</Text>
                  <Text style={styles.promoCode}>Use code: BUGGEE50</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.promoCopyBtn} activeOpacity={0.8}>
                <Ionicons name="copy-outline" size={18} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Fare & Payment Info */}
            <View style={[styles.waitingFareCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.fareRowCompact}>
                {/* Left Section - Money Icon & Price */}
                <View style={styles.fareLeftSection}>
                  <View style={[styles.fareIconWrap, { backgroundColor: colors.accentDim }]}>
                    <Ionicons name="cash" size={18} color={colors.accent} />
                  </View>
                  <View style={styles.fareAmountWrap}>
                    <Text style={[styles.fareAmountBig, { color: colors.text }]}>{bookedRide?.price || '₹49'}</Text>
                    <View style={[styles.farePaymentChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Ionicons name={selectedPaymentMethod === 'cash' ? 'cash-outline' : 'card-outline'} size={12} color={colors.accent} />
                      <Text style={[styles.farePaymentText, { color: colors.text }]}>{selectedPaymentMethod === 'cash' ? 'Cash' : 'Card'}</Text>
                    </View>
                  </View>
                </View>
                {/* Three Dots - Far Right */}
                <TouchableOpacity
                  style={[styles.fareThreeDotsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    setRideDetailsOpenedFrom('waiting');
                    openRideDetailsDrawer();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelRideButton, { borderColor: colors.border }]}
              onPress={() => {
                setCancelInitiatedFrom('waiting');
                openCancelReasonsDrawer();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelRideText, { color: '#E53935' }]}>Cancel Ride</Text>
            </TouchableOpacity>
        </Animated.View>
      )}

      {/* Ride Details Drawer */}
      <Modal visible={isRideDetailsDrawerOpen} animationType="none" transparent statusBarTranslucent={true} onRequestClose={closeRideDetailsDrawer}>
        <Animated.View style={[styles.drawerOverlay, { backgroundColor: colors.overlay, opacity: rideDetailsDrawerFadeAnim }]}>
          <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={closeRideDetailsDrawer} />
          <Animated.View style={[styles.rideDetailsDrawerContent, { backgroundColor: colors.modalBg, borderColor: colors.border, borderTopWidth: 1, paddingBottom: Math.max(insets.bottom, 40), transform: [{ translateY: rideDetailsDrawerSlideAnim }] }]}>
            <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <Text style={[styles.rideDetailsTitle, { color: colors.text }]}>Ride Details</Text>

            {/* Locations Card */}
            <View style={[styles.rideDetailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Pickup */}
              <View style={styles.rideDetailsRow}>
                <View style={[styles.simpleLocationDot, { backgroundColor: colors.accent }]} />
                <View style={styles.rideDetailsTextWrap}>
                  <Text style={[styles.rideDetailsLabel, { color: colors.textSub }]}>PICKUP</Text>
                  <Text style={[styles.rideDetailsValue, { color: colors.text }]} numberOfLines={1}>{bookedRide?.pickup || 'Current Location'}</Text>
                </View>
              </View>

              <View style={styles.rideDetailsRouteLine}>
                <View style={[styles.simpleRouteLinePath, { backgroundColor: colors.border }]} />
              </View>

              {/* Drop */}
              <View style={styles.rideDetailsRow}>
                <View style={[styles.simpleLocationSquare, { borderColor: '#E53935' }]} />
                <View style={styles.rideDetailsTextWrap}>
                  <Text style={[styles.rideDetailsLabel, { color: colors.textSub }]}>DROP-OFF</Text>
                  <Text style={[styles.rideDetailsValue, { color: colors.text }]} numberOfLines={1}>{bookedRide?.drop || 'Destination'}</Text>
                </View>
              </View>
            </View>

            {/* Price Section */}
            <View style={[styles.rideDetailsPriceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.rideDetailsPriceRow}>
                <View style={styles.rideDetailsPriceLeft}>
                  <View style={[styles.priceIconWrap, { backgroundColor: colors.accentDim }]}>
                    <Ionicons name="pricetag-outline" size={20} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={[styles.rideDetailsPriceLabel, { color: colors.textSub }]}>Total Fare</Text>
                    <Text style={[styles.rideDetailsPriceValue, { color: colors.text }]}>
                      {bookedRide?.price || '₹ 49'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.paymentMethodSection}>
              <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>Payment Method</Text>
              <View style={styles.paymentMethodOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    { backgroundColor: colors.surface, borderColor: selectedPaymentMethod === 'cash' ? colors.accent : colors.border },
                    selectedPaymentMethod === 'cash' && { borderWidth: 2 }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPaymentMethod('cash');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.paymentMethodIcon, { backgroundColor: selectedPaymentMethod === 'cash' ? colors.accentDim : colors.card }]}>
                    <Ionicons name="cash-outline" size={22} color={selectedPaymentMethod === 'cash' ? colors.accent : colors.textSub} />
                  </View>
                  <Text style={[styles.paymentMethodText, { color: selectedPaymentMethod === 'cash' ? colors.accent : colors.text }]}>Cash</Text>
                  {selectedPaymentMethod === 'cash' && (
                    <View style={[styles.paymentMethodCheck, { backgroundColor: colors.accent }]}>
                      <Ionicons name="checkmark" size={12} color="#000" />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    { backgroundColor: colors.surface, borderColor: selectedPaymentMethod === 'card' ? colors.accent : colors.border },
                    selectedPaymentMethod === 'card' && { borderWidth: 2 }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPaymentMethod('card');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.paymentMethodIcon, { backgroundColor: selectedPaymentMethod === 'card' ? colors.accentDim : colors.card }]}>
                    <Ionicons name="card-outline" size={22} color={selectedPaymentMethod === 'card' ? colors.accent : colors.textSub} />
                  </View>
                  <Text style={[styles.paymentMethodText, { color: selectedPaymentMethod === 'card' ? colors.accent : colors.text }]}>Card</Text>
                  {selectedPaymentMethod === 'card' && (
                    <View style={[styles.paymentMethodCheck, { backgroundColor: colors.accent }]}>
                      <Ionicons name="checkmark" size={12} color="#000" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Share Trip Button */}
            <TouchableOpacity
              style={[
                styles.shareBoxButton,
                { backgroundColor: shareTripEnabled ? colors.accentDim : colors.surface, borderColor: shareTripEnabled ? colors.accent : colors.border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShareTripEnabled(!shareTripEnabled);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.shareBoxLeft}>
                <View style={[styles.shareLocationIcon, { backgroundColor: shareTripEnabled ? colors.accent : colors.card }]}>
                  <Ionicons name="location" size={20} color={shareTripEnabled ? '#000' : colors.textSub} />
                </View>
                <View style={styles.shareBoxTextWrap}>
                  <Text style={[styles.shareBoxTitle, { color: shareTripEnabled ? colors.accent : colors.text }]}>Share Trip</Text>
                  <Text style={[styles.shareBoxDesc, { color: colors.textSub }]}>Let friends track your ride</Text>
                </View>
              </View>
              <View style={[styles.shareBoxIndicator, { backgroundColor: shareTripEnabled ? colors.accent : colors.border }]}>
                <Ionicons name="share-social" size={16} color={shareTripEnabled ? '#000' : colors.textSub} />
              </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.rideDetailsButtons}>
              <TouchableOpacity
                style={[styles.closeDetailButton, { backgroundColor: colors.accent }]}
                onPress={closeRideDetailsDrawer}
                activeOpacity={0.85}
              >
                <Text style={[styles.closeDetailText, { color: '#000' }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Cancel Reasons Drawer */}
      <Modal visible={isCancelReasonsDrawerOpen} animationType="none" transparent statusBarTranslucent={true} onRequestClose={closeCancelReasonsDrawer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Animated.View style={[styles.drawerOverlay, { backgroundColor: colors.overlay, opacity: cancelReasonsDrawerFadeAnim }]}>
            <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={closeCancelReasonsDrawer} />
            <Animated.View style={[styles.cancelReasonsDrawerContent, { backgroundColor: colors.modalBg, borderColor: colors.border, borderTopWidth: 1, paddingBottom: Math.max(insets.bottom, 40), transform: [{ translateY: cancelReasonsDrawerSlideAnim }] }]}>
              <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Header */}
                <Text style={[styles.cancelReasonsTitle, { color: colors.text }]}>Why do you want to cancel?</Text>
                <Text style={[styles.cancelReasonsSubtitle, { color: colors.textSub }]}>Help us improve by selecting a reason</Text>

                {/* Reason Options */}
                <View style={styles.cancelReasonsList}>
                  <TouchableOpacity
                    style={[styles.cancelReasonItem, { borderColor: colors.border, opacity: showCustomReasonInput ? 0.5 : 1 }]}
                    onPress={() => handleCancelReasonSelect('Driver is too far')}
                    activeOpacity={0.7}
                    disabled={showCustomReasonInput}
                  >
                    <View style={[styles.cancelReasonIcon, { backgroundColor: colors.surface }]}>
                      <Ionicons name="time-outline" size={22} color={colors.textSub} />
                    </View>
                    <Text style={[styles.cancelReasonText, { color: colors.text }]}>Driver is too far</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelReasonItem, { borderColor: colors.border, opacity: showCustomReasonInput ? 0.5 : 1 }]}
                    onPress={() => handleCancelReasonSelect('Changed my mind')}
                    activeOpacity={0.7}
                    disabled={showCustomReasonInput}
                  >
                    <View style={[styles.cancelReasonIcon, { backgroundColor: colors.surface }]}>
                      <Ionicons name="refresh-outline" size={22} color={colors.textSub} />
                    </View>
                    <Text style={[styles.cancelReasonText, { color: colors.text }]}>Changed my mind</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelReasonItem, { borderColor: colors.border, opacity: showCustomReasonInput ? 0.5 : 1 }]}
                    onPress={() => handleCancelReasonSelect('Wrong pickup location')}
                    activeOpacity={0.7}
                    disabled={showCustomReasonInput}
                  >
                    <View style={[styles.cancelReasonIcon, { backgroundColor: colors.surface }]}>
                      <Ionicons name="location-outline" size={22} color={colors.textSub} />
                    </View>
                    <Text style={[styles.cancelReasonText, { color: colors.text }]}>Wrong pickup location</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelReasonItem, { borderColor: colors.border, opacity: showCustomReasonInput ? 0.5 : 1 }]}
                    onPress={() => handleCancelReasonSelect('Price is too high')}
                    activeOpacity={0.7}
                    disabled={showCustomReasonInput}
                  >
                    <View style={[styles.cancelReasonIcon, { backgroundColor: colors.surface }]}>
                      <Ionicons name="pricetag-outline" size={22} color={colors.textSub} />
                    </View>
                    <Text style={[styles.cancelReasonText, { color: colors.text }]}>Price is too high</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelReasonItem, { borderColor: colors.border }]}
                    onPress={() => setShowCustomReasonInput(true)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.cancelReasonIcon, { backgroundColor: colors.surface }]}>
                      <Ionicons name="ellipsis-horizontal-outline" size={22} color={colors.textSub} />
                    </View>
                    <Text style={[styles.cancelReasonText, { color: colors.text }]}>Other reason</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
                  </TouchableOpacity>
                </View>

            {/* Custom Reason Input */}
            {showCustomReasonInput && (
              <View style={styles.customReasonContainer}>
                <Text style={[styles.customReasonLabel, { color: colors.text }]}>Please specify your reason:</Text>
                <TextInput
                  style={[styles.customReasonInput, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  placeholder="Write your reason here..."
                  placeholderTextColor={colors.textSub}
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.submitReasonButton, {
                    backgroundColor: colors.accent,
                    opacity: customReason.trim().length > 0 ? 1 : 0.5
                  }]}
                  onPress={() => {
                    if (customReason.trim().length > 0) {
                      handleCancelReasonSelect(customReason);
                      setShowCustomReasonInput(false);
                      setCustomReason('');
                    }
                  }}
                  disabled={customReason.trim().length === 0}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.submitReasonText, { color: '#000' }]}>Submit</Text>
                </TouchableOpacity>
              </View>
            )}

                {/* Keep My Ride Button */}
                <TouchableOpacity
                  style={[styles.keepRideButton, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    closeCancelReasonsDrawer();
                    setCancelInitiatedFrom(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="car-outline" size={20} color="#000" />
                  <Text style={[styles.keepRideText, { color: '#000' }]}>Keep My Ride</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Cancel Confirmation Drawer */}
      <Modal visible={isCancelConfirmDrawerOpen} animationType="none" transparent statusBarTranslucent={true} onRequestClose={closeCancelConfirmDrawer}>
        <Animated.View style={[styles.drawerOverlay, { backgroundColor: colors.overlay, opacity: cancelConfirmDrawerFadeAnim }]}>
          <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={closeCancelConfirmDrawer} />
          <Animated.View style={[styles.cancelConfirmDrawerContent, { backgroundColor: colors.modalBg, borderColor: colors.border, borderTopWidth: 1, paddingBottom: Math.max(insets.bottom, 40), transform: [{ translateY: cancelConfirmDrawerSlideAnim }] }]}>
            <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />

            {/* Warning Icon */}
            <View style={styles.cancelConfirmIconWrap}>
              <View style={[styles.cancelConfirmIconOuter, { backgroundColor: 'rgba(229, 57, 53, 0.15)' }]}>
                <View style={[styles.cancelConfirmIconInner, { backgroundColor: '#E53935' }]}>
                  <Ionicons name="warning-outline" size={32} color="#FFF" />
                </View>
              </View>
            </View>

            {/* Text */}
            <Text style={[styles.cancelConfirmTitle, { color: colors.text }]}>Cancel Ride?</Text>
            <Text style={[styles.cancelConfirmSubtitle, { color: colors.textSub }]}>
              {selectedCancelReason ? `Reason: ${selectedCancelReason}` : 'Are you sure you want to cancel this ride?'}
            </Text>
            <Text style={[styles.cancelConfirmWarning, { color: colors.textSub }]}>
              Cancellation charges may apply if done frequently.
            </Text>

            {/* Action Buttons */}
            <View style={styles.cancelConfirmButtons}>
              <TouchableOpacity
                style={[styles.waitForDriverButton, { borderColor: colors.border }]}
                onPress={handleWaitForDriver}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={20} color={colors.text} />
                <Text style={[styles.waitForDriverText, { color: colors.text }]}>Wait for Driver</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmCancelButton, { backgroundColor: '#E53935' }]}
                onPress={handleConfirmCancel}
                activeOpacity={0.85}
              >
                <Text style={[styles.confirmCancelText, { color: '#FFF' }]}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Ride Booked Drawer - Floating Panel (map interactive) */}
      {isRideBookedDrawerOpen && (
        <Animated.View
          style={[
            styles.floatingRideBookedDrawer,
            {
              backgroundColor: colors.modalBg,
              paddingBottom: Math.max(insets.bottom, 20),
              transform: [{ translateY: rideBookedDrawerSlideAnim }]
            }
          ]}
        >
          <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />

            {/* Header with ETA and PIN */}
            <View style={styles.rideBookedHeader}>
              <View style={styles.rideBookedEtaWrap}>
                <Text style={[styles.rideBookedEtaSingle, { color: colors.text }]}>
                  Arriving in <Text style={styles.rideBookedEtaHighlight}>{driverArrivalMins} min</Text>
                </Text>
              </View>
              <View style={styles.rideBookedHeaderRight}>
                {/* PIN/OTP */}
                <View style={[styles.otpBox, { backgroundColor: colors.accent }]}>
                  <Text style={styles.otpLabel}>PIN</Text>
                  <Text style={styles.otpValue}>{rideOTP}</Text>
                </View>
                {/* Three Dots */}
                <TouchableOpacity
                  style={[styles.rideBookedDotsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    setRideDetailsOpenedFrom('booked');
                    openRideDetailsDrawer();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Driver Card */}
            <View style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.driverInfoRow}>
                {/* Driver Photo */}
                <View style={[styles.driverPhotoWrap, { borderColor: colors.accent }]}>
                  <Ionicons name="person" size={28} color={colors.accent} />
                </View>
                {/* Driver Details */}
                <View style={styles.driverDetailsWrap}>
                  <Text style={[styles.driverName, { color: colors.text }]}>{driverDetails.name}</Text>
                  <View style={styles.driverRatingRow}>
                    <Ionicons name="star" size={14} color="#FFB800" />
                    <Text style={[styles.driverRating, { color: colors.text }]}>{driverDetails.rating}</Text>
                    <View style={[styles.driverDot, { backgroundColor: colors.textSub }]} />
                    <Text style={[styles.driverTrips, { color: colors.textSub }]}>{driverDetails.trips} trips</Text>
                  </View>
                </View>
                {/* Call & Message Buttons */}
                <View style={styles.driverActionsRow}>
                  <TouchableOpacity style={[styles.driverActionBtn, { backgroundColor: colors.accentDim }]} activeOpacity={0.7}>
                    <Ionicons name="call" size={18} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.driverActionBtn, { backgroundColor: colors.accentDim }]} activeOpacity={0.7}>
                    <Ionicons name="chatbubble" size={18} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Divider */}
              <View style={[styles.driverDivider, { backgroundColor: colors.border }]} />

              {/* Car Details */}
              <View style={styles.carDetailsRow}>
                <View style={[styles.carIconWrap, { backgroundColor: colors.accentDim }]}>
                  <MaterialCommunityIcons name="car-side" size={22} color={colors.accent} />
                </View>
                <View style={styles.carTextWrap}>
                  <Text style={[styles.carModel, { color: colors.text }]}>{driverDetails.car.model}</Text>
                  <Text style={[styles.carColor, { color: colors.textSub }]}>{driverDetails.car.color}</Text>
                </View>
                <View style={[styles.carNumberPlate, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.carNumber, { color: colors.text }]}>{driverDetails.car.plateNumber}</Text>
                </View>
              </View>
            </View>

            {/* Pickup Location Card */}
            <View style={[styles.pickupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.pickupCardRow}>
                <View style={[styles.pickupIconWrap, { backgroundColor: colors.accentDim }]}>
                  <Ionicons name="location" size={18} color={colors.accent} />
                </View>
                <View style={styles.pickupTextWrap}>
                  <Text style={[styles.pickupLabel, { color: colors.textSub }]}>PICKUP POINT</Text>
                  <Text style={[styles.pickupAddress, { color: colors.text }]} numberOfLines={1}>{bookedRide?.pickup || 'Current Location'}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.rideBookedActions}>
              <TouchableOpacity
                style={[styles.shareRideBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social" size={18} color={colors.text} />
                <Text style={[styles.shareRideBtnText, { color: colors.text }]}>Share Trip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.safetyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
                <Text style={[styles.safetyBtnText, { color: colors.text }]}>Safety</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelRideSmallBtn, { borderColor: '#E53935' }]}
                onPress={() => {
                  setCancelInitiatedFrom('booked');
                  openCancelReasonsDrawer();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#E53935" />
              </TouchableOpacity>
            </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header — logo left, notification right ──
  floatingHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  logoContainer: {
    height: 44,
    width: 120,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  // ── FAB ──
  floatingFab: {
    position: 'absolute',
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },

  // ── Professional Precise Location Marker (Uber/Rapido/Ola style) ──
  markerContainer: {
    width: 70,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerRipple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
    top: 5,
  },
  markerBase: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 57, 53, 0.25)',
    top: 16,
  },
  markerPinWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 48,
    height: 60,
  },
  markerPinShadow: {
    position: 'absolute',
    top: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 2,
  },
  markerPinInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerPinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E53935',
    marginTop: -3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  // ══════════════════════════════════════════════════════════════════════
  // ROUTE MARKERS - Pickup (green) and Drop (red) markers
  // ══════════════════════════════════════════════════════════════════════
  currentLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── Premium 3D Pickup Marker (Circular Badge) ──
  pickupMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupMarkerGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00E676',
    opacity: 0.25,
  },
  pickupMarkerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  pickupMarkerInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  pickupMarkerShadow: {
    position: 'absolute',
    bottom: -6,
    width: 16,
    height: 6,
    borderRadius: 8,
    backgroundColor: '#000',
    opacity: 0.2,
  },

  // ── Premium 3D Drop Marker (Pin/Teardrop) ──
  dropMarkerContainer: {
    alignItems: 'center',
  },
  dropMarkerPin: {
    alignItems: 'center',
  },
  dropMarkerBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  dropMarkerFill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF1744',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropMarkerTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 12,
    borderRightWidth: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 8,
    borderTopColor: '#FFF',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    marginTop: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dropMarkerShadow: {
    position: 'absolute',
    bottom: -4,
    width: 18,
    height: 6,
    borderRadius: 9,
    backgroundColor: '#000',
    opacity: 0.25,
  },

  // ── Route Info Card (Small - below header) ──
  routeInfoCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  routeInfoTextSmall: {
    fontSize: 11,
    fontWeight: '600',
  },
  routeInfoDividerSmall: {
    width: 1,
    height: 12,
    marginHorizontal: 6,
  },

  // ── Bottom half ──
  bottomHalf: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    paddingTop: 8,
    paddingBottom: 90, // Space for tab bar
    zIndex: 20,
  },
  bottomHalfHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  floatingBookingCard: {
    paddingHorizontal: 0,
    paddingTop: 4,
  },
  bookingCardHeader: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  bookingSectionTitle: { fontSize: 19, fontWeight: '800', letterSpacing: 0.3 },
  bookingSectionSubtitle: { fontSize: 13, fontWeight: '500', marginTop: 2, marginBottom: 4 },

  // ── Booking Rows ──
  rideOptionsContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  bookingRowClean: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  bookingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1,
  },
  bookingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  // ── Tier Circles ──
  tierCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },

  // ── Tier Info ──
  tierInfo: { flex: 1 },
  tierNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierName: { fontSize: 16, fontWeight: '700' },
  tierDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  tierPrice: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  tierPriceUnit: { fontSize: 12, fontWeight: '500' },

  // ── Badges ──
  popularBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '700' },
  vipBadge: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },

  // ── Book Buttons ──
  bookBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 12, gap: 6,
  },
  bookBtnText: { fontSize: 13, fontWeight: '700' },



  // ── Location Permission Bottom Sheet ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 44,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 28,
  },
  modalIconWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconRipple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  modalIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
  },
  modalIconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F8B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  allowBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  allowBtnLoading: {
    opacity: 0.7,
  },
  allowBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  skipBtn: {
    paddingVertical: 10,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Floating Drawer (Uber/Rapido style - no overlay, map interactive) ──
  floatingDrawerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: DRAWER_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    zIndex: 1000, // Higher than tab bar (999) to receive touches
    // Premium shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 40,
  },
  floatingBookingDrawerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: DRAWER_HEIGHT_LARGE,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    zIndex: 1000, // Higher than tab bar (999) to receive touches
    // Premium shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 40,
  },
  floatingWaitingDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.72, // Taller to show cancel button
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 10,
    zIndex: 1000, // Higher than tab bar (999) to receive touches
    // Premium shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 40,
  },
  floatingRideBookedDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: DRAWER_HEIGHT_LARGE,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    zIndex: 1000, // Higher than tab bar (999) to receive touches
    // Premium shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 40,
  },
  invisibleBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },

  // ── Booking Drawer (legacy - kept for other modals) ──
  drawerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerContent: {
    maxHeight: DRAWER_HEIGHT,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  drawerHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 18,
  },
  drawerInnerContainer: { width: '100%' },
  drawerHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  drawerHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  drawerHeaderCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  drawerHeaderText: { flex: 1 },
  drawerHeaderTitleRow: { flexDirection: 'row', alignItems: 'center' },
  drawerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  drawerSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  drawerCloseButton: {
    width: 36, height: 36,
    borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  tierBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  drawerDetailsCard: {
    borderRadius: 20,
    padding: 18, borderWidth: 1, marginBottom: 20,
  },
  drawerSummaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  drawerDetailDescText: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
  featuresContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, paddingTop: 16,
  },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 13, fontWeight: '600' },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24, paddingHorizontal: 4,
  },
  priceLabel: { fontSize: 15, fontWeight: '600' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  drawerPriceText: { fontSize: 24, fontWeight: '900' },
  drawerPriceUnit: { fontSize: 14, fontWeight: '600', marginLeft: 2 },
  confirmBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, borderRadius: 16, gap: 8,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // ── Professional Booking Drawer (Industry Level) ──
  bookingDrawerContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  bookingBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },

  // Enhanced Ride Header
  enhancedRideHeader: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  rideHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rideIconContainer: {},
  rideIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideHeaderInfo: {
    flex: 1,
  },
  rideNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  rideHeaderName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularTagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumTagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rideHeaderDesc: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },
  ridePriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ridePriceText: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Simplified Locations Section
  simpleLocationsSection: {
    marginBottom: 24,
  },
  simpleLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simpleLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  simpleLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  simpleLocationSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 2,
  },
  simpleLocationTextWrap: {
    flex: 1,
  },
  simpleLocationLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  simpleLocationValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  simpleEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  simpleEditText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editLocationBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  editLocationTextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editLocationBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Simple Route Line
  simpleRouteLine: {
    paddingLeft: 6,
    paddingVertical: 10,
  },
  simpleRouteLinePath: {
    width: 2,
    height: 32,
    borderRadius: 1,
  },

  // Continue Button
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Confirmation Drawer
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  confirmationLocationsCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  confirmationLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  confirmationLocationTextWrap: {
    flex: 1,
    gap: 6,
  },
  confirmationLocationValue: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  confirmationRouteLine: {
    paddingLeft: 6,
    paddingVertical: 12,
  },
  confirmPickupButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  confirmPickupButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Location Selection Drawer - Full Screen
  locationFullScreen: {
    flex: 1,
  },
  locationDrawerContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  locationDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  locationDrawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  locationInputCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationDotWrap: {
    width: 24,
    alignItems: 'center',
  },
  locationDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 2,
  },
  locationInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationTextInput: {
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 4,
  },
  clearInputBtn: {
    padding: 4,
    marginLeft: 8,
  },
  locationInputDivider: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  locationDividerLine: {
    width: 2,
    height: 20,
    borderRadius: 1,
    marginLeft: 4,
  },
  nearbyPlacesList: {
    paddingBottom: 40,
  },
  suggestionsHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  locationConfirmWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationConfirmBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  locationConfirmText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  noResultsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noResultsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nearbyPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  nearbyPlaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyPlaceInfo: {
    flex: 1,
  },
  nearbyPlaceName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  nearbyPlaceAddress: {
    fontSize: 12,
    fontWeight: '500',
  },
  nearbyPlaceDistance: {
    fontSize: 12,
    fontWeight: '600',
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginLeft: 8,
  },

  // Waiting/Ride Requested Drawer
  waitingDrawerContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 18,
  },
  waitingIconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  waitingRipple: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
  },
  waitingPulseOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingPulseInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  waitingSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  waitingHeaderCenter: {
    alignItems: 'center',
    marginBottom: 12,
  },
  waitingDetailsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    width: '100%',
    marginBottom: 12,
  },
  waitingDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  waitingDetailTextWrap: {
    flex: 1,
    gap: 4,
  },
  waitingDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  waitingDetailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  waitingRouteLine: {
    paddingLeft: 6,
    paddingVertical: 10,
  },
  cancelRideButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    alignSelf: 'center',
  },
  cancelRideText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Waiting Drawer Header
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  waitingTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  threeDotsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // Ride Details Drawer
  rideDetailsDrawerContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  rideDetailsTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 20,
  },
  rideDetailsCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  rideDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  rideDetailsTextWrap: {
    flex: 1,
    gap: 4,
  },
  rideDetailsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rideDetailsValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  rideDetailsRouteLine: {
    paddingLeft: 6,
    paddingVertical: 10,
  },
  rideDetailsPriceCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  rideDetailsPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rideDetailsPriceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rideDetailsPriceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  rideDetailsPriceValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  paymentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  shareTripCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareTripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shareTripIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareTripTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  shareTripDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  toggleButton: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  toggleButtonActive: {},
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  rideDetailsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelRideDetailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  cancelRideDetailText: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeDetailButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  closeDetailText: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Cancel Reasons Drawer
  cancelReasonsDrawerContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  cancelReasonsTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelReasonsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelReasonsList: {
    marginBottom: 20,
  },
  cancelReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  cancelReasonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelReasonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  keepRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  keepRideText: {
    fontSize: 16,
    fontWeight: '800',
  },
  customReasonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  customReasonLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  customReasonInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 90,
    marginBottom: 12,
  },
  submitReasonButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReasonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Cancel Confirmation Drawer
  cancelConfirmDrawerContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  cancelConfirmIconWrap: {
    marginVertical: 20,
  },
  cancelConfirmIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelConfirmIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelConfirmTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  cancelConfirmSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelConfirmWarning: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  cancelConfirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  waitForDriverButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  waitForDriverText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Buggee Promo Banner
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  promoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  promoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoTextWrap: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  promoCode: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.7)',
    marginTop: 2,
  },
  promoCopyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Waiting Fare Card
  waitingFareCard: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    marginBottom: 12,
    width: '100%',
  },
  fareRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fareIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fareAmountWrap: {
    gap: 2,
  },
  fareAmountBig: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  farePaymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  farePaymentText: {
    fontSize: 10,
    fontWeight: '600',
  },
  fareThreeDotsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  waitingFareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waitingFareLeft: {},
  waitingFareLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  waitingFareValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  waitingPaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  waitingPaymentText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Price Icon Wrap
  priceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Payment Method Section
  paymentMethodSection: {
    marginBottom: 16,
  },
  paymentMethodTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  paymentMethodOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  paymentMethodCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Share Box Button
  shareBoxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  shareBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shareBoxTextWrap: {},
  shareBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  shareBoxDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  shareBoxIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Waiting Header Centered
  waitingHeaderCentered: {
    alignItems: 'center',
    marginBottom: 16,
  },

  // Advertisement Poster
  adPoster: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    overflow: 'hidden',
  },
  adPosterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adPosterLeft: {
    flex: 1,
  },
  adPosterDiscount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    overflow: 'hidden',
  },
  adPosterTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
  },
  adPosterCode: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.7)',
  },
  adPosterRight: {
    marginLeft: 16,
  },

  // Ride Booked Drawer
  rideBookedDrawer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 18,
  },
  rideBookedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 8,
  },
  rideBookedEtaWrap: {
    flex: 1,
  },
  rideBookedEtaSingle: {
    fontSize: 22,
    fontWeight: '700',
  },
  rideBookedEtaHighlight: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E53935',
  },
  rideBookedHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  otpBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
    opacity: 0.7,
  },
  otpValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },
  rideBookedDotsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  driverCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverPhotoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetailsWrap: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '800',
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  driverRating: {
    fontSize: 14,
    fontWeight: '700',
  },
  driverDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  driverTrips: {
    fontSize: 13,
    fontWeight: '500',
  },
  driverActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  driverActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDivider: {
    height: 1,
    marginVertical: 14,
  },
  carDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  carModel: {
    fontSize: 15,
    fontWeight: '700',
  },
  carColor: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  carNumberPlate: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  carNumber: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pickupCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  pickupCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  pickupLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  pickupAddress: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  rideBookedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  shareRideBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareRideBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  safetyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  safetyBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelRideSmallBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },

  mapRecenterFab: {
    position: 'absolute',
    right: 16,
    bottom: 260, // Fixed position on map, just above "Choose Your Ride" drawer (Uber/Rapido style)
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    zIndex: 1001, // Above all drawers to ensure always visible and clickable
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },

});