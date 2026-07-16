/**
 * HomeScreen - Main ride booking screen
 * Refactored to use Zustand store, extracted hooks, and modular drawer components
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Components
import {
  BookingDrawer,
  CancelConfirmDrawer,
  CancelReasonsDrawer,
  LocationSearchDrawer,
  RideBookedDrawer,
  RideDetailsDrawer,
  TierSelectionDrawer,
  WaitingDrawer,
} from '@/components/drawers';
import CustomTabBar from '@/components/navigation/CustomTabBar';

// Store & Hooks
import { useBackHandler } from '@/hooks/useBackHandler';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useMapControls } from '@/hooks/useMapControls';
import { useRideTimer } from '@/hooks/useRideTimer';
import { useRoute } from '@/hooks/useRoute';
import { useRideStore } from '@/store/rideStore';

// Constants & Theme
import { darkMapStyle, lightMapStyle } from '@/constants/mapStyles';
import { tierDetails } from '@/constants/rideTiers';
import { useAppTheme } from '@/context/ThemeContext';
import { lightImpact, mediumImpact, successNotification } from '@/services/hapticService';

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // ═══════════════════════════════════════════════════════════════════
  // ZUSTAND STORE - All state managed centrally
  // ═══════════════════════════════════════════════════════════════════
  const {
    selectedTier,
    setSelectedTier,
    tierLocations,
    pickupCoords,
    dropCoords,
    routeCoordinates,
    routeInfo,
    isDrawerOpen,
    isBookingDrawerOpen,
    isLocationDrawerOpen,
    isWaitingDrawerOpen,
    isRideBookedDrawerOpen,
    isRideDetailsDrawerOpen,
    isCancelReasonsDrawerOpen,
    isCancelConfirmDrawerOpen,
    openDrawer,
    closeDrawer,
    setLocationSelectionType,
    setBookedRide,
    setDriverArrivalMins,
    setSelectedCancelReason,
    setCancelInitiatedFrom,
    setRideDetailsOpenedFrom,
    clearRoute,
    resetRideState,
  } = useRideStore();

  // Get current tier's locations
  const currentPickup = selectedTier ? tierLocations[selectedTier].pickup : '';
  const currentDrop = selectedTier ? tierLocations[selectedTier].drop : '';

  // ═══════════════════════════════════════════════════════════════════
  // HOOKS - Business logic extracted
  // ═══════════════════════════════════════════════════════════════════
  const { userLocation, region } = useLocationTracking(mapRef);
  useRoute(mapRef);
  useRideTimer({
    onTimerComplete: () => {
      closeDrawer('waiting');
      setTimeout(() => {
        successNotification();
        setDriverArrivalMins(Math.floor(Math.random() * 6) + 3);
        openDrawer('rideBooked');
      }, 350);
    },
  });
  const { handleRecenter } = useMapControls({ mapRef, userLocation });
  useBackHandler();

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════
  const tabBarAnim = useRef(new Animated.Value(0)).current; // Start hidden
  const rideSectionSlideAnim = useRef(new Animated.Value(400)).current; // Start off-screen
  const hasAnimatedIn = useRef(false);

  // Hide/show bottom section based on any drawer being open
  const anyDrawerOpen = isDrawerOpen || isBookingDrawerOpen || isWaitingDrawerOpen || isRideBookedDrawerOpen;

  // Initial launch animation - slide up the Choose Your Ride section
  useEffect(() => {
    if (!hasAnimatedIn.current) {
      hasAnimatedIn.current = true;
      // Delay slightly to let the map load first
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(rideSectionSlideAnim, {
            toValue: 0,
            tension: 50,
            friction: 12,
            useNativeDriver: true,
          }),
          Animated.timing(tabBarAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }, 300);
    }
  }, []);

  // Hide/show bottom section when drawers open/close
  useEffect(() => {
    if (hasAnimatedIn.current) {
      Animated.parallel([
        Animated.timing(tabBarAnim, {
          toValue: anyDrawerOpen ? 0 : 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(rideSectionSlideAnim, {
          toValue: anyDrawerOpen ? 600 : 0,
          tension: 55,
          friction: 14,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [anyDrawerOpen]);

  // ═══════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════
  const handleOpenTierDrawer = useCallback((tier: 'Standard' | 'Delux' | 'VIP') => {
    lightImpact();
    setSelectedTier(tier);
    openDrawer('tier');
  }, [setSelectedTier, openDrawer]);

  const handleOpenBookingDrawer = useCallback((tier: 'Standard' | 'Delux' | 'VIP') => {
    mediumImpact();
    setSelectedTier(tier);
    if (isDrawerOpen) {
      closeDrawer('tier');
      setTimeout(() => openDrawer('booking'), 350);
    } else {
      openDrawer('booking');
    }
  }, [isDrawerOpen, setSelectedTier, openDrawer, closeDrawer]);

  const handleRequestRide = useCallback(() => {
    if (currentPickup && currentDrop && selectedTier) {
      setBookedRide({
        tier: selectedTier,
        pickup: currentPickup,
        drop: currentDrop,
        price: tierDetails[selectedTier].price,
      });
      closeDrawer('booking');
      setTimeout(() => {
        successNotification();
        openDrawer('waiting');
      }, 350);
    }
  }, [currentPickup, currentDrop, selectedTier, setBookedRide, closeDrawer, openDrawer]);

  const handleCancelReasonSelect = useCallback((reason: string) => {
    lightImpact();
    setSelectedCancelReason(reason);
    closeDrawer('cancelReasons');
    setTimeout(() => openDrawer('cancelConfirm'), 300);
  }, [setSelectedCancelReason, closeDrawer, openDrawer]);

  const handleConfirmCancel = useCallback(() => {
    resetRideState();
    clearRoute();
  }, [resetRideState, clearRoute]);

  const handleWaitForDriver = useCallback(() => {
    closeDrawer('cancelConfirm');
    closeDrawer('rideDetails');
    setCancelInitiatedFrom(null);
  }, [closeDrawer, setCancelInitiatedFrom]);

  const handleSelectPlace = useCallback((place: { name: string; lat?: string; lon?: string }) => {
    // Place selection is handled inside LocationSearchDrawer via the store
    // This callback can be used for additional logic if needed
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        customMapStyle={isDark ? darkMapStyle : lightMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {/* Pickup Marker */}
        {pickupCoords && (
          <Marker coordinate={pickupCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={[styles.markerContainer, { backgroundColor: colors.accent }]}>
              <Ionicons name="location" size={20} color="#000" />
            </View>
          </Marker>
        )}

        {/* Drop Marker */}
        {dropCoords && (
          <Marker coordinate={dropCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={[styles.markerContainer, { backgroundColor: '#E53935' }]}>
              <Ionicons name="flag" size={18} color="#FFF" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.accent}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Top Bar - Logo & Notification Button */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* Premium Floating Logo Pill */}
        <View style={[styles.logoContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            contentFit="cover"
          />
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.notificationBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/notifications' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Route Info Badge */}
      {routeInfo && (
        <View style={[styles.routeInfoBadge, { backgroundColor: colors.card, borderColor: colors.border, top: insets.top + 60 }]}>
          <Ionicons name="navigate" size={16} color={colors.accent} />
          <Text style={[styles.routeInfoText, { color: colors.text }]}>
            {routeInfo.distance} • {routeInfo.duration}
          </Text>
        </View>
      )}

      {/* Floating Recenter Button - Positioned above drawer */}
      <TouchableOpacity
        style={[
          styles.recenterBtn,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            bottom: anyDrawerOpen ? SCREEN_HEIGHT * 0.52 : 560,
          }
        ]}
        onPress={handleRecenter}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={22} color={colors.accent} />
      </TouchableOpacity>

      {/* Choose Your Ride Section */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            transform: [{ translateY: rideSectionSlideAnim }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Ride</Text>

        {/* Tier Cards */}
        {(['Standard', 'Delux', 'VIP'] as const).map((tier, index) => (
          <React.Fragment key={tier}>
            {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            <View style={styles.tierRow}>
              <TouchableOpacity style={styles.tierLeft} onPress={() => handleOpenTierDrawer(tier)} activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name={tier === 'Standard' ? 'car-side' : tier === 'Delux' ? 'car-sports' : 'crown'}
                  size={32}
                  color={isDark ? '#FFF' : '#000'}
                  style={{ width: 36, marginRight: 16 }}
                />
                <View style={styles.tierInfo}>
                  <View style={styles.tierNameRow}>
                    <Text style={[styles.tierName, { color: colors.text }]}>{tier}</Text>
                    <TouchableOpacity onPress={() => handleOpenTierDrawer(tier)}>
                      <Ionicons name="information-circle-outline" size={18} color={colors.textSub} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.tierDesc, { color: colors.textSub }]}>{tierDetails[tier].desc}</Text>
                  <Text style={[styles.tierPrice, { color: colors.accent }]}>
                    {tierDetails[tier].price} <Text style={{ color: colors.textSub }}>/km</Text>
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bookBtn, { backgroundColor: colors.accent }]}
                onPress={() => handleOpenBookingDrawer(tier)}
                activeOpacity={0.85}
              >
                <Text style={styles.bookBtnText}>Book</Text>
                <Ionicons name="arrow-forward" size={15} color="#000" />
              </TouchableOpacity>
            </View>
          </React.Fragment>
        ))}
      </Animated.View>

      {/* Custom Tab Bar */}
      <CustomTabBar activeTab="home" style={{ opacity: tabBarAnim }} />

      {/* ═══════════════════════════════════════════════════════════════════
          DRAWER COMPONENTS - All extracted for modularity
          Components get their data from the Zustand store
          ═══════════════════════════════════════════════════════════════════ */}

      <TierSelectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => closeDrawer('tier')}
      />

      <BookingDrawer
        isOpen={isBookingDrawerOpen}
        onClose={() => closeDrawer('booking')}
        onOpenLocationDrawer={(type: 'pickup' | 'drop') => {
          setLocationSelectionType(type);
          openDrawer('location');
        }}
        onRequestRide={handleRequestRide}
      />

      <LocationSearchDrawer
        isOpen={isLocationDrawerOpen}
        onClose={() => closeDrawer('location')}
        onSelectPlace={handleSelectPlace}
      />

      <WaitingDrawer
        isOpen={isWaitingDrawerOpen}
        onViewDetails={() => {
          setRideDetailsOpenedFrom('waiting');
          openDrawer('rideDetails');
        }}
        onCancel={() => {
          setCancelInitiatedFrom('waiting');
          openDrawer('cancelReasons');
        }}
      />

      <RideBookedDrawer
        isOpen={isRideBookedDrawerOpen}
        onViewDetails={() => {
          setRideDetailsOpenedFrom('booked');
          openDrawer('rideDetails');
        }}
        onCancel={() => {
          setCancelInitiatedFrom('booked');
          openDrawer('cancelReasons');
        }}
      />

      <RideDetailsDrawer
        isOpen={isRideDetailsDrawerOpen}
        onClose={() => closeDrawer('rideDetails')}
      />

      <CancelReasonsDrawer
        isOpen={isCancelReasonsDrawerOpen}
        onClose={() => closeDrawer('cancelReasons')}
        onSelectReason={handleCancelReasonSelect}
      />

      <CancelConfirmDrawer
        isOpen={isCancelConfirmDrawerOpen}
        onClose={() => closeDrawer('cancelConfirm')}
        onConfirm={handleConfirmCancel}
        onWaitForDriver={handleWaitForDriver}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STYLES - Minimal, only what's needed for main screen
// ═══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
 logoContainer: {
  width: 140,
  height: 52,
  borderRadius: 26,
  overflow: 'hidden',
  justifyContent: 'center',
  alignItems: 'center',
},

logo: {
  width: '100%',
  height: '100%',
},
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recenterBtn: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 500,
  },
  routeInfoBadge: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 100,
    // Premium shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  tierLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierInfo: {
    flex: 1,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
  },
  tierDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  tierPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  divider: {
    height: 1,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});
