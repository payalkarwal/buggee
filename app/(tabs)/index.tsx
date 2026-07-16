/**
 * HomeScreen - Main ride booking screen
 *
 * DRAWER STATE MACHINE:
 * - Uses `activeDrawer` for single source of truth (no transition gaps)
 * - Uses `returnToDrawer` for cancel/details return navigation
 * - Uses `isLocationModalOpen` for modal overlay
 * - "Choose Your Ride" only visible when `activeDrawer === null`
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
  // ZUSTAND STORE - Single source of truth for drawer state
  // ═══════════════════════════════════════════════════════════════════
  const {
    selectedTier,
    setSelectedTier,
    tierLocations,
    pickupCoords,
    dropCoords,
    routeCoordinates,
    routeInfo,
    // Drawer state machine
    activeDrawer,
    isLocationModalOpen,
    navigateToDrawer,
    openLocationModal,
    closeLocationModal,
    returnToPreviousDrawer,
    // Location
    setLocationSelectionType,
    // Booking
    setBookedRide,
    setDriverArrivalMins,
    // Cancel
    setSelectedCancelReason,
    resetCancelState,
    // Global
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
      // Timer complete: transition from waiting → rideBooked
      successNotification();
      setDriverArrivalMins(Math.floor(Math.random() * 6) + 3);
      navigateToDrawer('rideBooked');
    },
  });
  const { handleRecenter } = useMapControls({ mapRef, userLocation });
  useBackHandler();

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════
  const tabBarAnim = useRef(new Animated.Value(0)).current;
  const rideSectionSlideAnim = useRef(new Animated.Value(400)).current;
  const hasAnimatedIn = useRef(false);

  // A drawer is active when activeDrawer is not null (excludes location modal)
  const hasActiveDrawer = activeDrawer !== null;

  // Initial launch animation
  useEffect(() => {
    if (!hasAnimatedIn.current) {
      hasAnimatedIn.current = true;
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

  // Hide/show Choose Your Ride based on active drawer
  // No gaps because activeDrawer switches instantly between drawers
  useEffect(() => {
    if (hasAnimatedIn.current) {
      Animated.parallel([
        Animated.timing(tabBarAnim, {
          toValue: hasActiveDrawer ? 0 : 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(rideSectionSlideAnim, {
          toValue: hasActiveDrawer ? 600 : 0,
          tension: 55,
          friction: 14,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasActiveDrawer]);

  // ═══════════════════════════════════════════════════════════════════
  // DRAWER NAVIGATION HANDLERS
  // All use navigateToDrawer for instant transitions (no gaps)
  // ═══════════════════════════════════════════════════════════════════

  const handleOpenTierDrawer = useCallback((tier: 'Standard' | 'Delux' | 'VIP') => {
    lightImpact();
    setSelectedTier(tier);
    navigateToDrawer('tier');
  }, [setSelectedTier, navigateToDrawer]);

  const handleOpenBookingDrawer = useCallback((tier: 'Standard' | 'Delux' | 'VIP') => {
    mediumImpact();
    setSelectedTier(tier);
    navigateToDrawer('booking');
  }, [setSelectedTier, navigateToDrawer]);

  const handleRequestRide = useCallback(() => {
    if (currentPickup && currentDrop && selectedTier) {
      setBookedRide({
        tier: selectedTier,
        pickup: currentPickup,
        drop: currentDrop,
        price: tierDetails[selectedTier].price,
      });
      successNotification();
      navigateToDrawer('waiting');
    }
  }, [currentPickup, currentDrop, selectedTier, setBookedRide, navigateToDrawer]);

  // Cancel flow: store return drawer and navigate to cancel reasons
  const handleInitiateCancel = useCallback((from: 'waiting' | 'rideBooked') => {
    lightImpact();
    navigateToDrawer('cancelReasons', { returnTo: from });
  }, [navigateToDrawer]);

  const handleCancelReasonSelect = useCallback((reason: string) => {
    lightImpact();
    setSelectedCancelReason(reason);
    // Keep returnToDrawer intact, just switch to cancelConfirm
    navigateToDrawer('cancelConfirm');
  }, [setSelectedCancelReason, navigateToDrawer]);

  const handleConfirmCancel = useCallback(() => {
    // Actually cancel: reset everything and go to home
    resetRideState();
    clearRoute();
    // navigateToDrawer(null) is called by resetRideState
  }, [resetRideState, clearRoute]);

  const handleKeepMyRide = useCallback(() => {
    // Return to previous drawer (waiting or rideBooked)
    resetCancelState();
    returnToPreviousDrawer();
  }, [resetCancelState, returnToPreviousDrawer]);

  // Ride details flow: store return drawer and navigate
  const handleViewRideDetails = useCallback((from: 'waiting' | 'rideBooked') => {
    lightImpact();
    navigateToDrawer('rideDetails', { returnTo: from });
  }, [navigateToDrawer]);

  const handleCloseRideDetails = useCallback(() => {
    // Return to previous drawer
    returnToPreviousDrawer();
  }, [returnToPreviousDrawer]);

  // Location modal (separate from drawer flow)
  const handleOpenLocationDrawer = useCallback((type: 'pickup' | 'drop') => {
    setLocationSelectionType(type);
    openLocationModal();
  }, [setLocationSelectionType, openLocationModal]);

  const handleCloseLocationDrawer = useCallback(() => {
    closeLocationModal();
  }, [closeLocationModal]);

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
        {pickupCoords && (
          <Marker coordinate={pickupCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={[styles.markerContainer, { backgroundColor: colors.accent }]}>
              <Ionicons name="location" size={20} color="#000" />
            </View>
          </Marker>
        )}

        {dropCoords && (
          <Marker coordinate={dropCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={[styles.markerContainer, { backgroundColor: '#E53935' }]}>
              <Ionicons name="flag" size={18} color="#FFF" />
            </View>
          </Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.accent}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
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

      {/* Floating Recenter Button */}
      <TouchableOpacity
        style={[
          styles.recenterBtn,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            bottom: hasActiveDrawer ? SCREEN_HEIGHT * 0.52 : 560,
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
          DRAWER COMPONENTS
          Each checks `activeDrawer === 'their-type'` for visibility
          ═══════════════════════════════════════════════════════════════════ */}

      <TierSelectionDrawer
        isOpen={activeDrawer === 'tier'}
        onClose={() => navigateToDrawer(null)}
      />

      <BookingDrawer
        isOpen={activeDrawer === 'booking'}
        onClose={() => navigateToDrawer(null)}
        onOpenLocationDrawer={handleOpenLocationDrawer}
        onRequestRide={handleRequestRide}
      />

      <LocationSearchDrawer
        isOpen={isLocationModalOpen}
        onClose={handleCloseLocationDrawer}
      />

      <WaitingDrawer
        isOpen={activeDrawer === 'waiting'}
        onViewDetails={() => handleViewRideDetails('waiting')}
        onCancel={() => handleInitiateCancel('waiting')}
      />

      <RideBookedDrawer
        isOpen={activeDrawer === 'rideBooked'}
        onViewDetails={() => handleViewRideDetails('rideBooked')}
        onCancel={() => handleInitiateCancel('rideBooked')}
      />

      <RideDetailsDrawer
        isOpen={activeDrawer === 'rideDetails'}
        onClose={handleCloseRideDetails}
      />

      <CancelReasonsDrawer
        isOpen={activeDrawer === 'cancelReasons'}
        onClose={handleKeepMyRide}
        onSelectReason={handleCancelReasonSelect}
      />

      <CancelConfirmDrawer
        isOpen={activeDrawer === 'cancelConfirm'}
        onClose={handleKeepMyRide}
        onConfirm={handleConfirmCancel}
        onWaitForDriver={handleKeepMyRide}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STYLES
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
    width: 110,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
