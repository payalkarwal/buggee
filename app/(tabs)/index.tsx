import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView as SafeAreaContextView } from 'react-native-safe-area-context';

import CustomTabBar from '@/components/navigation/CustomTabBar';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  { elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1F1F1F' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0D0D0D' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0F0F0F' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0E1A12' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1F1F1F' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#262626' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#121212' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#080B10' }] },
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

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
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
  const [liveTracking, setLiveTracking] = useState(false);
  const centeredOnceRef = useRef(false); // first fix pe ek baar auto-center

  const [selectedTier, setSelectedTier] = useState<'Standard' | 'Delux' | 'VIP' | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [isConfirmationDrawerOpen, setIsConfirmationDrawerOpen] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('Current Location');
  const [dropLocation, setDropLocation] = useState('');
  const drawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const drawerFadeAnim = useRef(new Animated.Value(0)).current;
  const bookingDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bookingDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const confirmationDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const confirmationDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const tabBarAnim = useRef(new Animated.Value(1)).current;

  const openDrawer = (tier: 'Standard' | 'Delux' | 'VIP') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTier(tier);
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true
      }),
      Animated.timing(drawerFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
    ]).start();
  };

  const openBookingDrawer = (tier: 'Standard' | 'Delux' | 'VIP') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTier(tier);
    setIsBookingDrawerOpen(true);
    Animated.parallel([
      Animated.spring(bookingDrawerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true
      }),
      Animated.timing(bookingDrawerFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(drawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(drawerFadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 1,
        duration: 220,
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
      Animated.timing(bookingDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(bookingDrawerFadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 1,
        duration: 220,
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
        friction: 9,
        useNativeDriver: true
      }),
      Animated.timing(confirmationDrawerFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
    ]).start();
  };

  const closeConfirmationDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(confirmationDrawerSlideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(confirmationDrawerFadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(tabBarAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      }),
    ]).start(() => {
      setIsConfirmationDrawerOpen(false);
    });
  };

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

  // Handle returning from ride-options with updated locations
  useEffect(() => {
    if (returnedPickup || returnedDrop) {
      if (returnedPickup) setPickupLocation(returnedPickup);
      if (returnedDrop) setDropLocation(returnedDrop);

      // Re-open the booking drawer with the updated locations
      if (returnedTier) {
        setSelectedTier(returnedTier as 'Standard' | 'Delux' | 'VIP');
        setTimeout(() => openBookingDrawer(returnedTier as 'Standard' | 'Delux' | 'VIP'), 300);
      }
    }
  }, [returnedPickup, returnedDrop, returnedTier]);

  // ── LIVE precise GPS — pin exact spot pe rehta hai aur move pe update hota hai ──
  // NOTE: Real precision sirf physical device pe milti hai (simulator fake/0 deta hai).
  useEffect(() => {
    if (!liveTracking) return;
    let posSub: Location.LocationSubscription | null = null;

    const startWatch = async () => {
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
      {/* Map */}
      <View style={{ height: SCREEN_HEIGHT * 0.50 }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          customMapStyle={isDark ? darkMapStyle : lightMapStyle}
          showsUserLocation={false}
          showsCompass={false}
          showsScale={false}
          rotateEnabled
          pitchEnabled
        >
          {/* Precise pickup location pin — Professional Uber/Rapido style */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              zIndex={2}
            >
              <Animated.View style={[styles.markerContainer, { transform: [{ scale: markerBounceAnim }] }]} collapsable={false}>
                {/* Outer ripple effect */}
                <Animated.View
                  style={[
                    styles.markerRipple,
                    {
                      transform: [
                        {
                          scale: markerRippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.5],
                          }),
                        },
                      ],
                      opacity: markerRippleAnim.interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [0.4, 0.15, 0],
                      }),
                    },
                  ]}
                />

                {/* Pulsing base circle */}
                <Animated.View
                  style={[
                    styles.markerBase,
                    {
                      transform: [{ scale: markerPulseAnim }],
                    },
                  ]}
                />

                {/* Main pin */}
                <View style={styles.markerPinWrapper}>
                  <View style={styles.markerPinShadow} />
                  <View style={styles.markerPin}>
                    <View style={styles.markerPinInner}>
                      <Ionicons name="location" size={18} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.markerPinPoint} />
                </View>
              </Animated.View>
            </Marker>
          )}
        </MapView>
      </View>

      {/* Header overlay — only notification button */}
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
            <Ionicons
              name="notifications-outline"
              size={26}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaContextView>

      {/* Location Button - Show precise location */}
      <TouchableOpacity
        style={[styles.locationFab, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setLocationModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="location" size={22} color={colors.accent} />
      </TouchableOpacity>

      {/* Recenter FAB */}
      <TouchableOpacity
        style={[styles.floatingFab, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleRecenter}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={22} color={colors.accent} />
      </TouchableOpacity>

      {/* Booking card */}
      <View style={[styles.bottomHalf, { backgroundColor: colors.bg, borderColor: colors.border }]}>
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
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={colors.textSub}
                    />
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
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={colors.textSub}
                    />
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
                  <Text style={[styles.tierName, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                    VIP
                  </Text>
                  <TouchableOpacity onPress={() => openDrawer('VIP')} activeOpacity={0.6}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={colors.textSub}
                    />
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

        
      </View>

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

      {/* Booking Drawer */}
      <Modal visible={isDrawerOpen} animationType="none" transparent onRequestClose={closeDrawer}>
        <Animated.View style={[styles.drawerOverlay, { backgroundColor: colors.overlay, opacity: drawerFadeAnim }]}>
          <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={closeDrawer} />
          <Animated.View style={[styles.drawerContent, { backgroundColor: colors.modalBg, borderColor: colors.border, borderTopWidth: 1, transform: [{ translateY: drawerSlideAnim }] }]}>
            <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />
            {selectedTier && (() => {
              const details = tierDetails[selectedTier];
              return (
                <View style={styles.drawerInnerContainer}>
                  <View style={styles.drawerHeader}>
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
                    <TouchableOpacity onPress={closeDrawer} style={[styles.drawerCloseButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Ionicons name="close" size={18} color={colors.text} />
                    </TouchableOpacity>
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
        </Animated.View>
      </Modal>

      {/* Booking Drawer - Pickup/Drop Selection */}
      <Modal visible={isBookingDrawerOpen} animationType="none" transparent onRequestClose={closeBookingDrawer}>
        <Animated.View style={[styles.drawerOverlay, { backgroundColor: colors.overlay, opacity: bookingDrawerFadeAnim }]}>
          <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={closeBookingDrawer} />
          <Animated.View style={[styles.bookingDrawerContent, { backgroundColor: colors.modalBg, borderColor: colors.border, borderTopWidth: 1, transform: [{ translateY: bookingDrawerSlideAnim }] }]}>
            <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />
            {selectedTier && (() => {
              const details = tierDetails[selectedTier];
              return (
                <View style={styles.drawerInnerContainer}>
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
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        closeBookingDrawer();
                        setTimeout(() => {
                          const params = new URLSearchParams();
                          params.append('tier', selectedTier);
                          params.append('type', 'pickup');
                          params.append('pickup', pickupLocation);
                          if (dropLocation) params.append('drop', dropLocation);
                          router.push('/rides/ride-options?' + params.toString());
                        }, 300);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.simpleLocationLeft}>
                        <View style={[styles.simpleLocationDot, { backgroundColor: colors.accent }]} />
                        <View style={styles.simpleLocationTextWrap}>
                          <Text style={[styles.simpleLocationLabel, { color: colors.textSub }]}>Pickup location</Text>
                          <Text style={[styles.simpleLocationValue, { color: colors.text }]}>{pickupLocation}</Text>
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
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        closeBookingDrawer();
                        setTimeout(() => {
                          const params = new URLSearchParams();
                          params.append('tier', selectedTier);
                          params.append('type', 'drop');
                          params.append('pickup', pickupLocation);
                          if (dropLocation) params.append('drop', dropLocation);
                          router.push('/rides/ride-options?' + params.toString());
                        }, 300);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.simpleLocationLeft}>
                        <View style={[styles.simpleLocationSquare, { borderColor: '#E53935' }]} />
                        <View style={styles.simpleLocationTextWrap}>
                          <Text style={[styles.simpleLocationLabel, { color: colors.textSub }]}>Drop off location</Text>
                          <Text style={[styles.simpleLocationValue, { color: dropLocation ? colors.text : colors.textSub }]}>
                            {dropLocation || 'Where to?'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
                    </TouchableOpacity>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: colors.accent, opacity: (pickupLocation && dropLocation) ? 1 : 0.5 }]}
                    onPress={() => {
                      if (pickupLocation && dropLocation) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        closeBookingDrawer();
                        setTimeout(() => openConfirmationDrawer(), 300);
                      }
                    }}
                    disabled={!pickupLocation || !dropLocation}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.continueButtonText, { color: '#000' }]}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              );
            })()}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Confirmation Drawer - Confirm Pickup Spot */}
      <Modal visible={isConfirmationDrawerOpen} animationType="none" transparent onRequestClose={closeConfirmationDrawer}>
        <Animated.View style={[styles.drawerOverlay, { backgroundColor: colors.overlay, opacity: confirmationDrawerFadeAnim }]}>
          <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={closeConfirmationDrawer} />
          <Animated.View style={[styles.bookingDrawerContent, { backgroundColor: colors.modalBg, borderColor: colors.border, borderTopWidth: 1, transform: [{ translateY: confirmationDrawerSlideAnim }] }]}>
            <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />
            <View style={styles.drawerInnerContainer}>
              {/* Heading */}
              <Text style={[styles.confirmationTitle, { color: colors.text }]}>Confirm the pickup spot</Text>

              {/* Locations Display */}
              <View style={[styles.confirmationLocationsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Pickup Location */}
                <View style={styles.confirmationLocationRow}>
                  <View style={[styles.simpleLocationDot, { backgroundColor: colors.accent }]} />
                  <View style={styles.confirmationLocationTextWrap}>
                    <Text style={[styles.simpleLocationLabel, { color: colors.textSub }]}>PICKUP</Text>
                    <Text style={[styles.confirmationLocationValue, { color: colors.text }]}>{pickupLocation}</Text>
                  </View>
                </View>

                {/* Visual Route Line */}
                <View style={styles.confirmationRouteLine}>
                  <View style={[styles.simpleRouteLinePath, { backgroundColor: colors.border }]} />
                </View>

                {/* Drop Location */}
                <View style={styles.confirmationLocationRow}>
                  <View style={[styles.simpleLocationSquare, { borderColor: '#E53935' }]} />
                  <View style={styles.confirmationLocationTextWrap}>
                    <Text style={[styles.simpleLocationLabel, { color: colors.textSub }]}>DROP-OFF</Text>
                    <Text style={[styles.confirmationLocationValue, { color: colors.text }]}>{dropLocation}</Text>
                  </View>
                </View>
              </View>

              {/* Confirm Pickup Button */}
              <TouchableOpacity
                style={[styles.confirmPickupButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  closeConfirmationDrawer();
                  setTimeout(() => {
                    router.push('/rides/ride-options?tier=' + selectedTier + '&pickup=' + encodeURIComponent(pickupLocation) + '&drop=' + encodeURIComponent(dropLocation) + '&autoShow=true');
                  }, 300);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.confirmPickupButtonText, { color: '#000' }]}>Confirm Pickup</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
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
    height: 52,
    width: 140,
    borderRadius: 26,
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
  locationFab: {
    position: 'absolute',
    right: 16,
    top: SCREEN_HEIGHT * 0.50 - 122,
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
  floatingFab: {
    position: 'absolute',
    right: 16,
    top: SCREEN_HEIGHT * 0.50 - 66,
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

  // ── Bottom half ──
  bottomHalf: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
  },
  floatingBookingCard: {
    paddingHorizontal: 0,
    paddingTop: 22,
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

  // ── Booking Drawer ──
  drawerOverlay: { flex: 1, justifyContent: 'flex-end' },
  drawerBackdrop: { ...StyleSheet.absoluteFillObject },
  drawerContent: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 50, paddingTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 20,
  },
  drawerHandle: {
    width: 44, height: 5,
    borderRadius: 2.5, alignSelf: 'center', marginBottom: 22,
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
    paddingBottom: 50,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
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

});