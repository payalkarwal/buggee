import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
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
    color: '#FCD451',
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
    color: '#FCD451',
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
    color: '#FCD451',
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
  const [isFullDetailsOpen, setIsFullDetailsOpen] = useState(false);
  const drawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const drawerFadeAnim = useRef(new Animated.Value(0)).current;
  const tabBarAnim = useRef(new Animated.Value(1)).current;

  const openDrawer = (tier: 'Standard' | 'Delux' | 'VIP') => {
    setSelectedTier(tier);
    setIsDrawerOpen(true);
    setIsFullDetailsOpen(false);
    Animated.parallel([
      Animated.spring(drawerSlideAnim, { toValue: 0, tension: 45, friction: 8, useNativeDriver: true }),
      Animated.timing(drawerFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(tabBarAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerSlideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      Animated.timing(drawerFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(tabBarAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setIsDrawerOpen(false);
      setSelectedTier(null);
    });
  };

  const modalSlideAnim = useRef(new Animated.Value(500)).current;
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (isLocationModalVisible) {
      modalSlideAnim.setValue(500);
      modalFadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(modalFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(modalSlideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
      ]).start();
    }
  }, [isLocationModalVisible]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalSlideAnim, { toValue: 500, duration: 260, useNativeDriver: true }),
      Animated.timing(modalFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setLocationModalVisible(false));
  };

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const savedLocation = await AsyncStorage.getItem('userLocation');
        if (savedLocation) setSelectedLocation(savedLocation);
      } catch { }
      // Agar permission pehle se hai to chup-chaap live pin start kar do
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') setLiveTracking(true);
      // Small delay so map renders first, then modal slides up
      setTimeout(() => setLocationModalVisible(true), 400);
    };
    loadLocation();
  }, []);

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
    const target = userLocation ?? region;
    mapRef.current?.animateToRegion(
      { latitude: target.latitude, longitude: target.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      700
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
          {/* Precise pickup location pin — Rapido / Ola / Uber style */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={true}
              zIndex={2}
            >
              <View style={styles.pinWrap} collapsable={false}>
                <Ionicons name="location-sharp" size={46} color="#E53935" style={styles.pinIcon} />
                <View style={styles.pinInnerDot} />
              </View>
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
              router.push(ROUTES.NOTIFICATIONS)
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
              onPress={() => router.push('/rides/booking?tier=Standard')}
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
              onPress={() => router.push('/rides/booking?tier=Delux')}
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
              onPress={() => router.push('/rides/booking?tier=VIP')}
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

  // ── Precise location pin (Rapido / Ola / Uber style) ──
  pinWrap: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pinIcon: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  pinInnerDot: {
    position: 'absolute',
    top: 11,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#FFFFFF',
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
    shadowColor: '#FCD451',
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


});