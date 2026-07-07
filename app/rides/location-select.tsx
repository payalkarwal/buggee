import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

const SEARCH_SUGGESTIONS = [
  { id: '1', name: 'Home', address: '123 Main Street, City', icon: 'home' as const },
  { id: '2', name: 'Work', address: '456 Business Ave, City', icon: 'briefcase' as const },
  { id: '3', name: 'Airport', address: 'International Airport, City', icon: 'airplane' as const },
  { id: '4', name: 'Mall', address: 'Central Shopping Mall, City', icon: 'cart' as const },
];

export default function LocationSelectScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const type = (params.type as 'pickup' | 'drop') || 'pickup';
  const tier = params.tier as string;

  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  const [markerCoordinate, setMarkerCoordinate] = useState({
    latitude: 28.6139,
    longitude: 77.209,
  });

  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showConfirmDrawer, setShowConfirmDrawer] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const mapRef = useRef<MapView>(null);
  const confirmDrawerAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setRegion({ ...coords, latitudeDelta: 0.015, longitudeDelta: 0.015 });
          setMarkerCoordinate(coords);
          fetchAddress(coords);
        }
      } catch (error) {
        console.log('Location error:', error);
      }
    };
    getCurrentLocation();
  }, []);

  const fetchAddress = async (coords: { latitude: number; longitude: number }) => {
    setIsLoadingAddress(true);
    try {
      const [address] = await Location.reverseGeocodeAsync(coords);
      if (address) {
        const parts = [address.name, address.street, address.district, address.city, address.region].filter(Boolean);
        setSelectedAddress(parts.join(', '));
      }
    } catch (error) {
      console.log('Geocoding error:', error);
      setSelectedAddress('Selected Location');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleMapPress = (event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const coords = event.nativeEvent.coordinate;
    setMarkerCoordinate(coords);
    fetchAddress(coords);
  };

  const handleRecenter = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setMarkerCoordinate(coords);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.015, longitudeDelta: 0.015 }, 500);
      fetchAddress(coords);
    } catch (error) {
      console.log('Recenter error:', error);
    }
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConfirmDrawer(true);
    Animated.spring(confirmDrawerAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleFinalConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Navigate to booking confirmation or back to home
    router.push('/(tabs)');
  };

  const handleSuggestionPress = (suggestion: typeof SEARCH_SUGGESTIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery(suggestion.name);
    setSelectedAddress(suggestion.address);
    setIsSearchFocused(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Map */}
      <View style={styles.mapContainer}>
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
          onPress={handleMapPress}
        >
          {/* Center Marker */}
          <Marker
            coordinate={markerCoordinate}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <Ionicons name="location" size={42} color="#E53935" />
          </Marker>
        </MapView>

        {/* Header Overlay */}
        <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={[styles.backButton, { backgroundColor: colors.bg, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {type === 'pickup' ? 'Pickup Location' : 'Drop-off Location'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSub }]}>
              {type === 'pickup' ? 'Set your pickup point' : 'Where do you want to go?'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSub} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={type === 'pickup' ? 'Search pickup location...' : 'Search destination...'}
            placeholderTextColor={colors.textSub}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchQuery('');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSub} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Suggestions */}
        {isSearchFocused && (
          <ScrollView
            style={[styles.suggestionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            keyboardShouldPersistTaps="handled"
          >
            {SEARCH_SUGGESTIONS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                <View style={[styles.suggestionIconContainer, { backgroundColor: colors.accentDim }]}>
                  <Ionicons name={suggestion.icon} size={18} color={colors.accent} />
                </View>
                <View style={styles.suggestionTextContainer}>
                  <Text style={[styles.suggestionName, { color: colors.text }]}>{suggestion.name}</Text>
                  <Text style={[styles.suggestionAddress, { color: colors.textSub }]} numberOfLines={1}>
                    {suggestion.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Recenter Button */}
        <TouchableOpacity
          style={[styles.recenterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleRecenter}
          activeOpacity={0.8}
        >
          <Ionicons name="locate" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Bottom Address Drawer */}
      <View style={[styles.bottomDrawer, { backgroundColor: colors.bg, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.addressIconContainer, { backgroundColor: type === 'pickup' ? colors.accentDim : '#FFE5E5' }]}>
            <Ionicons name="location" size={20} color={type === 'pickup' ? colors.accent : '#E53935'} />
          </View>
          <View style={styles.addressTextContainer}>
            <Text style={[styles.addressLabel, { color: colors.textSub }]}>
              {type === 'pickup' ? 'Pickup Location' : 'Drop-off Location'}
            </Text>
            {isLoadingAddress ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                {selectedAddress || 'Select a location on the map'}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.accent }]}
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={!selectedAddress}
        >
          <Text style={[styles.confirmButtonText, { color: '#000' }]}>Confirm Location</Text>
          <Ionicons name="checkmark-circle" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Confirmation Drawer */}
      <Modal
        visible={showConfirmDrawer}
        animationType="fade"
        transparent
        statusBarTranslucent={true}
        onRequestClose={() => setShowConfirmDrawer(false)}
      >
        <View style={[styles.confirmOverlay, { backgroundColor: colors.overlay }]}>
          <Animated.View
            style={[
              styles.confirmDrawer,
              { backgroundColor: colors.modalBg, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 24), transform: [{ translateY: confirmDrawerAnim }] },
            ]}
          >
            {/* Success Icon */}
            <View style={[styles.successIconContainer, { backgroundColor: colors.accentDim }]}>
              <View style={[styles.successIconInner, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark" size={36} color="#000" />
              </View>
            </View>

            <Text style={[styles.confirmTitle, { color: colors.text }]}>Location Confirmed!</Text>
            <Text style={[styles.confirmSubtitle, { color: colors.textSub }]}>
              Your {type === 'pickup' ? 'pickup' : 'drop-off'} location has been set
            </Text>

            {/* Selected Location */}
            <View style={[styles.confirmLocationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location" size={20} color={type === 'pickup' ? colors.accent : '#E53935'} />
              <Text style={[styles.confirmLocationText, { color: colors.text }]} numberOfLines={2}>
                {selectedAddress}
              </Text>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              onPress={handleFinalConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryButtonText, { color: '#000' }]}>Confirm Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowConfirmDrawer(false);
                Animated.timing(confirmDrawerAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textSub }]}>Change Location</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  searchContainer: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 150,
    left: 16,
    right: 16,
    maxHeight: 300,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  suggestionAddress: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  markerIcon: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  markerDot: {
    position: 'absolute',
    top: 11,
    width: 13,
    height: 13,
    borderRadius: 6.5,
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 180,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomDrawer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    gap: 16,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  confirmOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  confirmDrawer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 0,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmLocationCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  confirmLocationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
