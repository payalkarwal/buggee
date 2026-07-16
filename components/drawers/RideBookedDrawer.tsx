/**
 * RideBookedDrawer - Driver found, showing driver details
 * Uses delayed opening animation for smooth transitions
 */
import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useRideStore } from '@/store/rideStore';
import { DRAWER_OPEN_DELAY, SPRING_CONFIG_OPEN, SPRING_CONFIG_CLOSE } from '@/constants/animations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RideBookedDrawerProps {
  isOpen: boolean;
  onCancel: () => void;
  onViewDetails: () => void;
}

export default function RideBookedDrawer({ isOpen, onCancel, onViewDetails }: RideBookedDrawerProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { bookedRide, driverDetails, rideOTP, driverArrivalMins } = useRideStore();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Mock driver details
  const driver = driverDetails || {
    name: 'Rajesh Kumar',
    rating: 4.8,
    trips: 1234,
    photo: null,
    car: { model: 'Swift Dzire', color: 'White', plateNumber: 'DL 4C AB 1234' },
  };

  React.useEffect(() => {
    let openTimeout: ReturnType<typeof setTimeout>;

    if (isOpen) {
      // Reset to bottom position immediately (no flash since component just mounted)
      slideAnim.setValue(SCREEN_HEIGHT);
      // Delay opening to let previous drawer slide down first
      openTimeout = setTimeout(() => {
        Animated.spring(slideAnim, { toValue: 0, ...SPRING_CONFIG_OPEN }).start();
      }, DRAWER_OPEN_DELAY);
    } else {
      Animated.spring(slideAnim, { toValue: SCREEN_HEIGHT, ...SPRING_CONFIG_CLOSE }).start();
    }

    return () => {
      if (openTimeout) clearTimeout(openTimeout);
    };
  }, [isOpen]);

  if (!isOpen || !bookedRide) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.modalBg, paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.successBadge, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="checkmark" size={16} color="#FFF" />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ride Confirmed!</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSub }]}>Driver arriving in {driverArrivalMins} min</Text>
      </View>

      {/* Driver Card */}
      <View style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.driverRow}>
          <View style={[styles.driverAvatar, { backgroundColor: colors.accentDim }]}>
            {driver.photo ? (
              <Image source={{ uri: driver.photo }} style={styles.driverPhoto} />
            ) : (
              <Ionicons name="person" size={28} color={colors.accent} />
            )}
          </View>
          <View style={styles.driverInfo}>
            <Text style={[styles.driverName, { color: colors.text }]}>{driver.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={[styles.ratingText, { color: colors.text }]}>{driver.rating}</Text>
              <Text style={[styles.tripsText, { color: colors.textSub }]}>• {driver.trips} trips</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.callButton, { backgroundColor: colors.accent }]}>
            <Ionicons name="call" size={20} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.carRow}>
          <Ionicons name="car-outline" size={20} color={colors.textSub} />
          <Text style={[styles.carText, { color: colors.text }]}>{driver.car.color} {driver.car.model}</Text>
          <Text style={[styles.plateText, { color: colors.accent }]}>{driver.car.plateNumber}</Text>
        </View>
      </View>

      {/* OTP */}
      <View style={[styles.otpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.otpLabel, { color: colors.textSub }]}>Share OTP with driver</Text>
        <View style={styles.otpRow}>
          {rideOTP.split('').map((digit, index) => (
            <View key={index} style={[styles.otpBox, { backgroundColor: colors.accentDim }]}>
              <Text style={[styles.otpDigit, { color: colors.accent }]}>{digit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.detailsButton, { borderColor: colors.border }]} onPress={onViewDetails}>
          <Ionicons name="document-text-outline" size={20} color={colors.text} />
          <Text style={[styles.detailsButtonText, { color: colors.text }]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cancelButton, { backgroundColor: '#FF4444' }]} onPress={onCancel}>
          <Ionicons name="close" size={20} color="#FFF" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 40,
  },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
  header: { alignItems: 'center', marginBottom: 20 },
  successBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  driverCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, padding: 16 },
  driverRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  driverPhoto: { width: 56, height: 56, borderRadius: 28 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 17, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 14, fontWeight: '600' },
  tripsText: { fontSize: 13 },
  callButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginVertical: 14 },
  carRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  carText: { flex: 1, fontSize: 14 },
  plateText: { fontSize: 14, fontWeight: '700' },
  otpCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20, alignItems: 'center' },
  otpLabel: { fontSize: 13, marginBottom: 12 },
  otpRow: { flexDirection: 'row', gap: 10 },
  otpBox: { width: 48, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  otpDigit: { fontSize: 24, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 12 },
  detailsButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  detailsButtonText: { fontSize: 14, fontWeight: '600' },
  cancelButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
