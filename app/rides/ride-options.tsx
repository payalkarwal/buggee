import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { useAppTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const tierPrices = {
  Standard: '₹ 120',
  Delux: '₹ 185',
  VIP: '₹ 295',
};

const tierIcons = {
  Standard: 'car-side' as const,
  Delux: 'car-sports' as const,
  VIP: 'crown' as const,
};

const NEARBY_PLACES = [
  {
    id: '1',
    name: '5/127, Block 17',
    address: 'Block 5, Subhash Nagar, Delhi',
    distance: '34 km',
  },
  {
    id: '2',
    name: 'Gurgaon Railway Station Parking',
    address: 'Kheri, Ashok Vihar, Sector 3, Gurugram, Haryana',
    distance: '16 km',
  },
  {
    id: '3',
    name: 'Jagannath Community College (JCC)',
    address: 'Community Center, Plot No. 2 & 3, Sector 3, Rohini, ...',
    distance: '43 km',
  },
  {
    id: '4',
    name: 'Centrum Plaza',
    address: 'Golf Course Rd, near ILM Institute, ILM Institute, S...',
    distance: '3.3 km',
  },
  {
    id: '5',
    name: 'Huda City Centre Metro',
    address: 'Huda City Centre, Sector 29, New Delhi, G...',
    distance: '7.5 km',
  },
  {
    id: '6',
    name: 'Netaji Subhash Place Metro Station Gate No. 1',
    address: 'Ring Rd, Near D Mall, Netaji Subhash Place, Shali...',
    distance: '42 km',
  },
];

export default function RideOptionsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const tier = (params.tier as 'Standard' | 'Delux' | 'VIP') || 'Standard';
  const type = params.type as string | undefined;
  const autoShow = params.autoShow === 'true';
  const initialPickup = params.pickup as string | undefined;
  const initialDrop = params.drop as string | undefined;

  const [pickupTime, setPickupTime] = useState<'now' | 'later'>('now');
  const [ridingFor, setRidingFor] = useState<'me' | 'other'>('me');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [isSelectingPickup, setIsSelectingPickup] = useState(type === 'pickup');
  const [isSelectingDrop, setIsSelectingDrop] = useState(type === 'drop');
  const [showWaitingDrawer, setShowWaitingDrawer] = useState(false);
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPickupTimeModal, setShowPickupTimeModal] = useState(false);
  const [showRidingForModal, setShowRidingForModal] = useState(false);
  const [showCancelReasonsModal, setShowCancelReasonsModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [showRideConfirmed, setShowRideConfirmed] = useState(false);

  const waitingDrawerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const waitingDrawerFadeAnim = useRef(new Animated.Value(0)).current;
  const detailsSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const confirmedSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showWaitingDrawer) {
      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();

      // Ripple animation
      const ripple = Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(rippleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      ripple.start();

      return () => {
        pulse.stop();
        ripple.stop();
      };
    }
  }, [showWaitingDrawer]);

  const handleSelectPlace = (place: typeof NEARBY_PLACES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isSelectingPickup) {
      setPickupLocation(place.name);
      setIsSelectingPickup(false);
      // Navigate back to home with updated pickup, preserving drop location
      setTimeout(() => {
        const searchParams = new URLSearchParams();
        searchParams.append('pickup', place.name);
        if (dropLocation) searchParams.append('drop', dropLocation);
        searchParams.append('tier', tier);
        router.push(('/(tabs)?' + searchParams.toString()) as Href);
      }, 200);
    } else if (isSelectingDrop) {
      setDropLocation(place.name);
      setIsSelectingDrop(false);
      // Navigate back to home with updated drop
      setTimeout(() => {
        const searchParams = new URLSearchParams();
        searchParams.append('pickup', pickupLocation);
        searchParams.append('drop', place.name);
        searchParams.append('tier', tier);
        router.push(('/(tabs)?' + searchParams.toString()) as Href);
      }, 200);
    } else {
      // If no selection mode, clicking should select drop location
      setDropLocation(place.name);
    }
  };

  // Update locations when URL params change
  useEffect(() => {
    setPickupLocation(initialPickup || 'Current Location');
    setDropLocation(initialDrop || '');
  }, [initialPickup, initialDrop]);

  // Auto-show waiting drawer when coming from confirmation
  useEffect(() => {
    if (autoShow && pickupLocation && dropLocation) {
      // Show waiting drawer immediately (no delay)
      setShowWaitingDrawer(true);
      Animated.parallel([
        Animated.spring(waitingDrawerSlideAnim, { toValue: 0, tension: 45, friction: 8, useNativeDriver: true }),
        Animated.timing(waitingDrawerFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      // After 15-30 seconds, show ride confirmed drawer
      setTimeout(() => {
        setShowWaitingDrawer(false);
        setTimeout(() => {
          setShowRideConfirmed(true);
          Animated.spring(confirmedSlideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }, 300);
      }, 20000); // 20 seconds (you can adjust between 15000-30000)
    }
  }, [autoShow]);

  const toggleTripDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTripDetails(!showTripDetails);
    Animated.spring(detailsSlideAnim, {
      toValue: showTripDetails ? SCREEN_HEIGHT : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleCancelRide = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCancelReasonsModal(true);
  };

  const confirmCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowCancelModal(false);
    setShowWaitingDrawer(false);
    router.back();
  };

  const closeWaitingDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(waitingDrawerSlideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      Animated.timing(waitingDrawerFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowWaitingDrawer(false);
      router.back();
    });
  };

  const bg = '#121212';
  const card = '#1E1E1E';
  const border = '#2A2A2A';
  const accent = '#FF4F8B';
  const textMain = '#F5F5F5';
  const textSub = '#888888';
  const pillBg = '#2A2A2A';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textMain }]}>Plan your ride</Text>
          {(isSelectingPickup || isSelectingDrop) && (
            <Text style={[styles.headerSubtitle, { color: textSub }]}>
              {isSelectingPickup ? 'Select pickup location' : 'Select drop off location'}
            </Text>
          )}
        </View>
      </View>

      {/* Pills Row */}
      <View style={styles.pillsRow}>
        {/* Pickup Time Pill */}
        <TouchableOpacity
          style={[styles.pill, { backgroundColor: pillBg, borderColor: border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowPickupTimeModal(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={15} color={textSub} style={{ marginRight: 5 }} />
          <Text style={[styles.pillText, { color: textMain }]}>
            {pickupTime === 'now' ? 'Pickup now' : 'Schedule later'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={textSub} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Riding For Pill */}
        <TouchableOpacity
          style={[styles.pill, { backgroundColor: pillBg, borderColor: border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowRidingForModal(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={15} color={textSub} style={{ marginRight: 5 }} />
          <Text style={[styles.pillText, { color: textMain }]}>
            {ridingFor === 'me' ? 'For me' : 'For someone'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={textSub} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Location Card */}
      <View style={[styles.locationCard, { backgroundColor: card, borderColor: border }]}>
        {/* Pickup Row */}
        <View style={styles.locationRow}>
          <View style={styles.dotWrap}>
            <View style={[styles.dotOuter, { borderColor: accent }]}>
              <View style={[styles.dotInner, { backgroundColor: accent }]} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationLabel, { color: textSub }]}>Pickup</Text>
            <TextInput
              style={[styles.locationInput, { color: textMain }]}
              value={pickupLocation}
              onChangeText={setPickupLocation}
              placeholder="Enter pickup location"
              placeholderTextColor={textSub}
              onFocus={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSelectingPickup(true);
                setIsSelectingDrop(false);
              }}
              onBlur={() => {
                setIsSelectingPickup(false);
              }}
            />
          </View>
        </View>

        {/* Divider line */}
        <View style={styles.connectorWrap}>
          <View style={[styles.connectorLine, { backgroundColor: (pickupLocation && dropLocation) ? accent : border }]} />
        </View>

        {/* Drop Row */}
        <View style={styles.locationRow}>
          <View style={styles.dotWrap}>
            <View style={[styles.dotSquare, { borderColor: '#E53935' }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationLabel, { color: textSub }]}>Drop off</Text>
            <TextInput
              style={[styles.locationInput, { color: dropLocation ? textMain : textSub }]}
              value={dropLocation}
              onChangeText={setDropLocation}
              placeholder="Where to?"
              placeholderTextColor={textSub}
              onFocus={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSelectingDrop(true);
                setIsSelectingPickup(false);
              }}
              onBlur={() => {
                setIsSelectingDrop(false);
              }}
            />
          </View>
        </View>
      </View>

      {/* Nearby Places List */}
      <FlatList
        data={NEARBY_PLACES}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.placeRow}
            onPress={() => handleSelectPlace(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.placeIconWrap, { backgroundColor: '#1F1F1F' }]}>
              <Ionicons name="time-outline" size={18} color={textSub} />
            </View>
            <View style={styles.placeTextWrap}>
              <Text style={[styles.placeName, { color: textMain }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.placeAddress, { color: textSub }]} numberOfLines={1}>
                <Text style={[styles.placeDistance, { color: textSub }]}>{item.distance}  </Text>
                {item.address}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: border }]} />
        )}
        ListFooterComponent={() => (
          <View style={{ marginTop: 8 }}>
            <View style={[styles.separator, { backgroundColor: border }]} />

            {/* Search in a different city */}
            <TouchableOpacity style={styles.bottomAction} activeOpacity={0.7}>
              <View style={[styles.bottomActionIcon, { backgroundColor: '#1F1F1F' }]}>
                <Ionicons name="globe-outline" size={18} color={textSub} />
              </View>
              <Text style={[styles.bottomActionText, { color: textMain }]}>
                Search in a different city
              </Text>
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: border }]} />

            {/* Set location on map */}
            <TouchableOpacity
              style={styles.bottomAction}
              activeOpacity={0.7}
              onPress={() =>
                router.push(`/rides/location-select?type=pickup&tier=${tier}`)
              }
            >
              <View style={[styles.bottomActionIcon, { backgroundColor: '#1F1F1F' }]}>
                <Ionicons name="location-outline" size={18} color={textSub} />
              </View>
              <Text style={[styles.bottomActionText, { color: textMain }]}>
                Set location on map
              </Text>
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: border }]} />

            {/* Saved places */}
            <TouchableOpacity style={styles.bottomAction} activeOpacity={0.7}>
              <View style={[styles.bottomActionIcon, { backgroundColor: '#1F1F1F' }]}>
                <Ionicons name="star-outline" size={18} color={textSub} />
              </View>
              <Text style={[styles.bottomActionText, { color: textMain }]}>
                Saved places
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Waiting Drawer - "Ride requested" */}
      <Modal visible={showWaitingDrawer} animationType="none" transparent statusBarTranslucent={true} onRequestClose={closeWaitingDrawer}>
        <Animated.View style={[styles.waitingOverlay, { backgroundColor: 'rgba(0,0,0,0.7)', opacity: waitingDrawerFadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeWaitingDrawer} />
          <Animated.View
            style={[
              styles.waitingDrawer,
              { backgroundColor: bg, borderColor: border, paddingBottom: Math.max(insets.bottom, 24), transform: [{ translateY: waitingDrawerSlideAnim }] },
            ]}
          >
            <View style={[styles.drawerHandle, { backgroundColor: border }]} />

            {/* Header */}
            <View style={styles.waitingHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.waitingTitle, { color: textMain }]}>Ride requested</Text>
                <Text style={[styles.waitingSubtitle, { color: textSub }]}>Finding drivers nearby</Text>
              </View>
              <TouchableOpacity
                onPress={closeWaitingDrawer}
                style={[styles.waitingCloseBtn, { backgroundColor: card, borderColor: border }]}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={textMain} />
              </TouchableOpacity>
            </View>

            {/* Loading Animation */}
            <View style={styles.waitingLoadingContainer}>
              <Animated.View
                style={[
                  styles.waitingRipple,
                  {
                    borderColor: accent,
                    transform: [
                      {
                        scale: rippleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2.2],
                        }),
                      },
                    ],
                    opacity: rippleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.4, 0.1, 0],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.waitingCircle,
                  { backgroundColor: '#2A2A2A', borderColor: accent, transform: [{ scale: pulseAnim }] },
                ]}
              >
                <MaterialCommunityIcons name={tierIcons[tier]} size={40} color={accent} />
              </Animated.View>
            </View>

            {/* Finding drivers loading line */}
            <View style={[styles.findingDriversLine, { backgroundColor: card, borderColor: border }]}>
              <View style={styles.loadingLineContainer}>
                <View style={[styles.loadingLine, { backgroundColor: border }]}>
                  <Animated.View
                    style={[
                      styles.loadingLineActive,
                      { backgroundColor: accent, transform: [{ scaleX: pulseAnim }] },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.findingDriversText, { color: textSub }]}>Finding drivers nearby...</Text>
            </View>

            {/* Ride Details Button */}
            <TouchableOpacity
              style={[styles.rideDetailsButton, { backgroundColor: card, borderColor: border }]}
              onPress={toggleTripDetails}
              activeOpacity={0.7}
            >
              <Text style={[styles.rideDetailsButtonText, { color: textMain }]}>Ride Details</Text>
              <Ionicons name="chevron-forward" size={20} color={textSub} />
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.waitingActions}>
              <TouchableOpacity
                style={[styles.cancelRideButton, { backgroundColor: '#FEE2E0', borderColor: '#E53935' }]}
                onPress={handleCancelRide}
                activeOpacity={0.85}
              >
                <Ionicons name="close-circle" size={20} color="#E53935" />
                <Text style={[styles.cancelRideText, { color: '#E53935' }]}>Cancel Ride</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.closeRideButton, { backgroundColor: card, borderColor: border }]}
                onPress={closeWaitingDrawer}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color={accent} />
                <Text style={[styles.closeRideText, { color: textMain }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Trip Details Drawer */}
      <Modal visible={showTripDetails} animationType="slide" transparent statusBarTranslucent={true} onRequestClose={toggleTripDetails}>
        <View style={[styles.detailsOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={toggleTripDetails} />
          <Animated.View
            style={[
              styles.detailsDrawer,
              { backgroundColor: bg, borderColor: border, paddingBottom: Math.max(insets.bottom, 24), transform: [{ translateY: detailsSlideAnim }] },
            ]}
          >
            <View style={[styles.drawerHandle, { backgroundColor: border }]} />
            <Text style={[styles.detailsDrawerTitle, { color: textMain }]}>Ride Details</Text>

            {/* Route Section with Visual Line - No container */}
            <View style={styles.detailsLocationRow}>
              <View style={[styles.detailsLocationDot, { backgroundColor: textMain }]} />
              <View style={styles.detailsLocationTextContainer}>
                <Text style={[styles.detailsLocationLabel, { color: textSub }]}>PICKUP</Text>
                <Text style={[styles.detailsLocationValue, { color: textMain }]} numberOfLines={2}>
                  {pickupLocation}
                </Text>
              </View>
            </View>

            {/* Vertical Route Line */}
            <View style={styles.detailsRouteLine}>
              <View style={[styles.detailsRouteLinePath, { backgroundColor: border }]} />
            </View>

            {/* Drop Location */}
            <View style={[styles.detailsLocationRow, { marginBottom: 24 }]}>
              <View style={[styles.detailsLocationSquare, { borderColor: textMain }]} />
              <View style={styles.detailsLocationTextContainer}>
                <Text style={[styles.detailsLocationLabel, { color: textSub }]}>DROP-OFF</Text>
                <Text style={[styles.detailsLocationValue, { color: textMain }]} numberOfLines={2}>
                  {dropLocation}
                </Text>
              </View>
            </View>

            {/* Fare Display */}
            <View style={[styles.detailsFareRow, { marginBottom: 20 }]}>
              <View style={styles.detailsFareLeft}>
                <Ionicons name="wallet-outline" size={20} color={textSub} />
                <Text style={[styles.detailsFareLabel, { color: textSub }]}>Estimated Fare</Text>
              </View>
              <Text style={[styles.detailsFareAmount, { color: textMain }]}>{tierPrices[tier]}</Text>
            </View>

            {/* Payment Method */}
            <View style={styles.detailsPaymentSection}>
              <View style={styles.detailsPaymentHeader}>
                <MaterialCommunityIcons name="cash" size={20} color={textSub} />
                <Text style={[styles.detailsPaymentLabel, { color: textSub }]}>Payment Method</Text>
              </View>
              <View style={styles.detailsPaymentOptions}>
                <TouchableOpacity
                  style={[
                    styles.detailsPaymentOption,
                    selectedPaymentMethod === 'cash' ? { backgroundColor: textMain, borderColor: textMain } : { backgroundColor: 'transparent', borderColor: border }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPaymentMethod('cash');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="cash"
                    size={18}
                    color={selectedPaymentMethod === 'cash' ? bg : textSub}
                  />
                  <Text style={[
                    styles.detailsPaymentOptionText,
                    { color: selectedPaymentMethod === 'cash' ? bg : textSub }
                  ]}>
                    Cash
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.detailsPaymentOption,
                    selectedPaymentMethod === 'card' ? { backgroundColor: textMain, borderColor: textMain } : { backgroundColor: 'transparent', borderColor: border }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPaymentMethod('card');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={selectedPaymentMethod === 'card' ? bg : textSub}
                  />
                  <Text style={[
                    styles.detailsPaymentOptionText,
                    { color: selectedPaymentMethod === 'card' ? bg : textSub }
                  ]}>
                    Card
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.detailsActions}>
              <TouchableOpacity
                style={[styles.detailsCancelButton, { backgroundColor: 'transparent', borderColor: border }]}
                onPress={() => {
                  toggleTripDetails();
                  setTimeout(() => handleCancelRide(), 300);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="close-circle" size={20} color="#E53935" />
                <Text style={[styles.detailsCancelText, { color: '#E53935' }]}>Cancel Ride</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.detailsConfirmButton, { backgroundColor: textMain }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  toggleTripDetails();
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.detailsConfirmText, { color: bg }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Ride Confirmed Drawer */}
      <Modal visible={showRideConfirmed} animationType="slide" transparent statusBarTranslucent={true} onRequestClose={() => setShowRideConfirmed(false)}>
        <View style={{ flex: 1 }}>
          {/* Map Background with Route */}
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: 28.6139,
              longitude: 77.2090,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            customMapStyle={darkMapStyle}
          >
            {/* Pickup Marker */}
            <Marker
              coordinate={{ latitude: 28.6139, longitude: 77.2090 }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <Ionicons name="location" size={38} color="#E53935" />
            </Marker>

            {/* Drop Marker */}
            <Marker
              coordinate={{ latitude: 28.6339, longitude: 77.2290 }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.markerContainer, { backgroundColor: '#E53935' }]}>
                <View style={[styles.markerSquare, { backgroundColor: bg, borderColor: '#E53935' }]} />
              </View>
            </Marker>

            {/* Route Line */}
            <Polyline
              coordinates={[
                { latitude: 28.6139, longitude: 77.2090 },
                { latitude: 28.6239, longitude: 77.2190 },
                { latitude: 28.6339, longitude: 77.2290 },
              ]}
              strokeColor={accent}
              strokeWidth={4}
              lineDashPattern={[0]}
            />
          </MapView>

          {/* Dark Overlay */}
          <View style={[styles.detailsOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.confirmedDrawer,
                { backgroundColor: bg, borderColor: border, paddingBottom: Math.max(insets.bottom, 24), transform: [{ translateY: confirmedSlideAnim }] },
              ]}
            >
            <View style={[styles.drawerHandle, { backgroundColor: border }]} />

            {/* Heading */}
            <Text style={[styles.confirmedTitle, { color: textMain }]}>Ride Booked!</Text>
            <Text style={[styles.confirmedSubtitle, { color: textSub }]}>Pick-up in 5 min</Text>

            {/* Share Pin Section */}
            <View style={[styles.sharePinCard, { backgroundColor: card, borderColor: border }]}>
              <TouchableOpacity
                style={styles.sharePinButton}
                activeOpacity={0.8}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Ionicons name="share-outline" size={18} color={textSub} />
                <Text style={[styles.sharePinText, { color: textMain }]}>Share Pin</Text>
              </TouchableOpacity>

              {/* PIN Boxes */}
              <View style={styles.pinContainer}>
                <View style={[styles.pinBox, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={[styles.pinDigit, { color: textMain }]}>4</Text>
                </View>
                <View style={[styles.pinBox, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={[styles.pinDigit, { color: textMain }]}>7</Text>
                </View>
                <View style={[styles.pinBox, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={[styles.pinDigit, { color: textMain }]}>2</Text>
                </View>
                <View style={[styles.pinBox, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={[styles.pinDigit, { color: textMain }]}>9</Text>
                </View>
              </View>
            </View>

            {/* Driver Info Card */}
            <View style={[styles.driverCard, { backgroundColor: card, borderColor: border }]}>
              <View style={styles.driverTopRow}>
                {/* Driver Photo & Name */}
                <View style={styles.driverPhotoSection}>
                  <View style={[styles.driverPhotoWrapper, { backgroundColor: bg, borderColor: border }]}>
                    <Ionicons name="person" size={32} color={textSub} />
                  </View>
                  <Text style={[styles.driverName, { color: textMain }]}>Rajesh Kumar</Text>
                </View>

                {/* Car Details */}
                <View style={styles.carDetailsSection}>
                  <Text style={[styles.carNumber, { color: textMain }]}>DL 3C AX 7890</Text>
                  <Text style={[styles.carFullName, { color: textMain }]}>Honda City 2023</Text>
                  <Text style={[styles.carBrand, { color: textSub }]}>Honda</Text>
                  <View style={styles.ridesCountRow}>
                    <Ionicons name="star" size={12} color={textSub} />
                    <Text style={[styles.ridesCount, { color: textSub }]}>1,247 rides</Text>
                  </View>
                </View>
              </View>

              {/* Message and Call Buttons */}
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={[styles.messageButton, { backgroundColor: textMain }]}
                  activeOpacity={0.8}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={bg} />
                  <Text style={[styles.messageButtonText, { color: bg }]}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.callButton, { backgroundColor: bg, borderColor: border }]}
                  activeOpacity={0.8}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <Ionicons name="call" size={20} color={textMain} />
                </TouchableOpacity>
              </View>
            </View>
            </Animated.View>
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal visible={showCancelModal} animationType="fade" transparent onRequestClose={() => setShowCancelModal(false)}>
        <View style={[styles.cancelOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.cancelModal, { backgroundColor: bg, borderColor: border }]}>
            <View style={[styles.cancelIconWrap, { backgroundColor: '#FEE' }]}>
              <Ionicons name="alert-circle" size={48} color="#E53935" />
            </View>

            <Text style={[styles.cancelModalTitle, { color: textMain }]}>Cancel this ride?</Text>
            <Text style={[styles.cancelModalSubtitle, { color: textSub }]}>
              Are you sure you want to cancel this ride request?
            </Text>

            <TouchableOpacity
              style={[styles.confirmCancelBtn, { backgroundColor: '#E53935' }]}
              onPress={confirmCancel}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmCancelText, { color: '#FFF' }]}>Yes, Cancel Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepRideBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCancelModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.keepRideText, { color: textMain }]}>Keep Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pickup Time Modal */}
      <Modal visible={showPickupTimeModal} animationType="fade" transparent statusBarTranslucent={true} onRequestClose={() => setShowPickupTimeModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowPickupTimeModal(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: bg, borderColor: border, paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={[styles.modalHandle, { backgroundColor: border }]} />

            <Text style={[styles.modalTitle, { color: textMain }]}>Pickup time</Text>

            <TouchableOpacity
              style={[
                styles.modalOption,
                pickupTime === 'now' && styles.modalOptionActive,
                { backgroundColor: pickupTime === 'now' ? accent + '15' : card, borderColor: pickupTime === 'now' ? accent : border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPickupTime('now');
                setTimeout(() => setShowPickupTimeModal(false), 200);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="time" size={22} color={pickupTime === 'now' ? accent : textMain} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.modalOptionTitle, { color: pickupTime === 'now' ? accent : textMain }]}>
                  Pickup now
                </Text>
                <Text style={[styles.modalOptionSubtitle, { color: textSub }]}>
                  Get picked up immediately
                </Text>
              </View>
              {pickupTime === 'now' && (
                <Ionicons name="checkmark-circle" size={24} color={accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalOption,
                pickupTime === 'later' && styles.modalOptionActive,
                { backgroundColor: pickupTime === 'later' ? accent + '15' : card, borderColor: pickupTime === 'later' ? accent : border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPickupTime('later');
                setTimeout(() => setShowPickupTimeModal(false), 200);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={22} color={pickupTime === 'later' ? accent : textMain} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.modalOptionTitle, { color: pickupTime === 'later' ? accent : textMain }]}>
                  Schedule for later
                </Text>
                <Text style={[styles.modalOptionSubtitle, { color: textSub }]}>
                  Choose a specific time
                </Text>
              </View>
              {pickupTime === 'later' && (
                <Ionicons name="checkmark-circle" size={24} color={accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Riding For Modal */}
      <Modal visible={showRidingForModal} animationType="fade" transparent statusBarTranslucent={true} onRequestClose={() => setShowRidingForModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowRidingForModal(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: bg, borderColor: border, paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={[styles.modalHandle, { backgroundColor: border }]} />

            <Text style={[styles.modalTitle, { color: textMain }]}>Who's riding?</Text>

            <TouchableOpacity
              style={[
                styles.modalOption,
                ridingFor === 'me' && styles.modalOptionActive,
                { backgroundColor: ridingFor === 'me' ? accent + '15' : card, borderColor: ridingFor === 'me' ? accent : border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRidingFor('me');
                setTimeout(() => setShowRidingForModal(false), 200);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="person" size={22} color={ridingFor === 'me' ? accent : textMain} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.modalOptionTitle, { color: ridingFor === 'me' ? accent : textMain }]}>
                  For me
                </Text>
                <Text style={[styles.modalOptionSubtitle, { color: textSub }]}>
                  You'll be taking this ride
                </Text>
              </View>
              {ridingFor === 'me' && (
                <Ionicons name="checkmark-circle" size={24} color={accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalOption,
                ridingFor === 'other' && styles.modalOptionActive,
                { backgroundColor: ridingFor === 'other' ? accent + '15' : card, borderColor: ridingFor === 'other' ? accent : border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRidingFor('other');
                setTimeout(() => setShowRidingForModal(false), 200);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="people" size={22} color={ridingFor === 'other' ? accent : textMain} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.modalOptionTitle, { color: ridingFor === 'other' ? accent : textMain }]}>
                  For someone else
                </Text>
                <Text style={[styles.modalOptionSubtitle, { color: textSub }]}>
                  Book a ride for another person
                </Text>
              </View>
              {ridingFor === 'other' && (
                <Ionicons name="checkmark-circle" size={24} color={accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Reasons Modal */}
      <Modal visible={showCancelReasonsModal} animationType="fade" transparent statusBarTranslucent={true} onRequestClose={() => setShowCancelReasonsModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowCancelReasonsModal(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: bg, borderColor: border, paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={[styles.modalHandle, { backgroundColor: border }]} />

            <Text style={[styles.modalTitle, { color: textMain }]}>Why do you want to cancel?</Text>

            {/* Cancel Reason Options */}
            <TouchableOpacity
              style={[
                styles.cancelReasonOption,
                selectedCancelReason === 'wrong_location' && styles.modalOptionActive,
                { backgroundColor: selectedCancelReason === 'wrong_location' ? accent + '15' : card, borderColor: selectedCancelReason === 'wrong_location' ? accent : border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCancelReason('wrong_location');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={22} color={selectedCancelReason === 'wrong_location' ? accent : textMain} />
              <Text style={[styles.cancelReasonText, { color: selectedCancelReason === 'wrong_location' ? accent : textMain }]}>
                Wrong pickup/drop location
              </Text>
              {selectedCancelReason === 'wrong_location' && (
                <Ionicons name="checkmark-circle" size={24} color={accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelReasonOption,
                selectedCancelReason === 'wait_time' && styles.modalOptionActive,
                { backgroundColor: selectedCancelReason === 'wait_time' ? accent + '15' : card, borderColor: selectedCancelReason === 'wait_time' ? accent : border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCancelReason('wait_time');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={22} color={selectedCancelReason === 'wait_time' ? accent : textMain} />
              <Text style={[styles.cancelReasonText, { color: selectedCancelReason === 'wait_time' ? accent : textMain }]}>
                Wait time is too long
              </Text>
              {selectedCancelReason === 'wait_time' && (
                <Ionicons name="checkmark-circle" size={24} color={accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelReasonOption,
                selectedCancelReason === 'price' && styles.modalOptionActive,
                { backgroundColor: selectedCancelReason === 'price' ? accent + '15' : card, borderColor: selectedCancelReason === 'price' ? accent : border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCancelReason('price');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="cash-outline" size={22} color={selectedCancelReason === 'price' ? accent : textMain} />
              <Text style={[styles.cancelReasonText, { color: selectedCancelReason === 'price' ? accent : textMain }]}>
                Fare is too high
              </Text>
              {selectedCancelReason === 'price' && (
                <Ionicons name="checkmark-circle" size={24} color={accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelReasonOption,
                selectedCancelReason === 'change_plans' && styles.modalOptionActive,
                { backgroundColor: selectedCancelReason === 'change_plans' ? accent + '15' : card, borderColor: selectedCancelReason === 'change_plans' ? accent : border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCancelReason('change_plans');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={22} color={selectedCancelReason === 'change_plans' ? accent : textMain} />
              <Text style={[styles.cancelReasonText, { color: selectedCancelReason === 'change_plans' ? accent : textMain }]}>
                Change of plans
              </Text>
              {selectedCancelReason === 'change_plans' && (
                <Ionicons name="checkmark-circle" size={24} color={accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelReasonOption,
                selectedCancelReason === 'other' && styles.modalOptionActive,
                { backgroundColor: selectedCancelReason === 'other' ? accent + '15' : card, borderColor: selectedCancelReason === 'other' ? accent : border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCancelReason('other');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal-circle-outline" size={22} color={selectedCancelReason === 'other' ? accent : textMain} />
              <Text style={[styles.cancelReasonText, { color: selectedCancelReason === 'other' ? accent : textMain }]}>
                Other reason
              </Text>
              {selectedCancelReason === 'other' && (
                <Ionicons name="checkmark-circle" size={24} color={accent} />
              )}
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.cancelReasonsActions}>
              <TouchableOpacity
                style={[styles.confirmCancelReasonBtn, { backgroundColor: '#E53935', opacity: selectedCancelReason ? 1 : 0.5 }]}
                onPress={() => {
                  if (selectedCancelReason) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    setShowCancelReasonsModal(false);
                    setShowWaitingDrawer(false);
                    router.back();
                  }
                }}
                disabled={!selectedCancelReason}
                activeOpacity={0.85}
              >
                <Text style={[styles.confirmCancelReasonText, { color: '#FFF' }]}>Confirm Cancellation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keepRideReasonBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCancelReasonsModal(false);
                  setSelectedCancelReason(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.keepRideReasonText, { color: textMain }]}>Keep My Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  /* Pills */
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Location Card */
  locationCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    position: 'relative',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 36,
  },
  dotWrap: {
    width: 20,
    alignItems: 'center',
  },
  dotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 2,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
  },
  locationInput: {
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
    margin: 0,
  },
  locationPlaceholder: {
    fontSize: 15,
    fontWeight: '400',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  connectorWrap: {
    paddingLeft: 9,
    marginVertical: 4,
  },
  connectorLine: {
    width: 2,
    height: 18,
    borderRadius: 1,
  },
  plusBtn: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Places List */
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 14,
  },
  placeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeTextWrap: {
    flex: 1,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 12,
    fontWeight: '400',
  },
  placeDistance: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },

  /* Bottom Actions */
  bottomAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  bottomActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActionText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Waiting Drawer Styles
  waitingOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  waitingDrawer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  drawerHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  waitingSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  waitingCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  waitingLoadingContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  waitingRipple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  waitingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  tripDetailsCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  tripDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  threeDotButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripDetailsSection: {
    marginBottom: 20,
  },
  tripDetailsHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  tripDetailsHeading: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  waitingLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  waitingLocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  waitingLocationSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 2,
    marginTop: 5,
  },
  waitingLocationLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  waitingLocationText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  waitingConnector: {
    width: 2,
    height: 16,
    marginLeft: 4,
    marginVertical: 6,
  },
  waitingFare: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
  },
  waitingFareLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  waitingFareAmount: {
    fontSize: 20,
    fontWeight: '900',
  },
  waitingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelRideButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
  },
  cancelRideText: {
    fontSize: 15,
    fontWeight: '800',
  },
  closeRideButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  closeRideText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Finding Drivers Line
  findingDriversLine: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  loadingLineContainer: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingLine: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  loadingLineActive: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    transformOrigin: 'left',
  },
  findingDriversText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Ride Details Button
  rideDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  rideDetailsButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Trip Details Drawer
  detailsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailsDrawer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  detailsDrawerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // Route Section in Details
  detailsRouteSection: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 0,
  },
  detailsLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  detailsLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 6,
  },
  detailsLocationSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 2.5,
    marginTop: 6,
  },
  detailsLocationTextContainer: {
    flex: 1,
    gap: 6,
  },
  detailsLocationLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailsLocationValue: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  detailsRouteLine: {
    paddingLeft: 7,
    paddingVertical: 10,
  },
  detailsRouteLinePath: {
    width: 2.5,
    height: 40,
    borderRadius: 2,
  },

  // Fare Section in Details
  detailsFareSection: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailsFareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsFareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsFareLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailsFareAmount: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Payment Section in Details
  detailsPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsPaymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsPaymentSection: {
    marginBottom: 24,
    gap: 14,
  },
  detailsPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  detailsPaymentLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailsPaymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsPaymentOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  detailsPaymentOptionText: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Action Buttons in Details
  detailsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsCancelButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
  },
  detailsCancelText: {
    fontSize: 15,
    fontWeight: '800',
  },
  detailsConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailsConfirmText: {
    fontSize: 15,
    fontWeight: '800',
  },
  detailsCloseButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailsCloseText: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Cancel Modal
  cancelOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cancelModal: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  cancelModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  cancelModalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 19,
  },
  confirmCancelBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '800',
  },
  keepRideBtn: {
    paddingVertical: 10,
  },
  keepRideText: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  modalOptionActive: {
    borderWidth: 2,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  modalOptionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Cancel Reasons Modal
  cancelReasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 12,
  },
  cancelReasonText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  cancelReasonsActions: {
    marginTop: 8,
  },
  confirmCancelReasonBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmCancelReasonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  keepRideReasonBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  keepRideReasonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Ride Confirmed Drawer
  confirmedDrawer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  confirmedTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  confirmedSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },

  // Share Pin Section
  sharePinCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  sharePinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sharePinText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pinContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  pinBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDigit: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Driver Card
  driverCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 20,
  },
  driverTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  driverPhotoSection: {
    alignItems: 'center',
    gap: 10,
  },
  driverPhotoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  carDetailsSection: {
    flex: 1,
    gap: 6,
  },
  carNumber: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  carFullName: {
    fontSize: 15,
    fontWeight: '700',
  },
  carBrand: {
    fontSize: 13,
    fontWeight: '600',
  },
  ridesCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  ridesCount: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Contact Buttons
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  callButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },

  // Close Button
  confirmedCloseButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  confirmedCloseText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Map Markers
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  markerSquare: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 2.5,
  },
});