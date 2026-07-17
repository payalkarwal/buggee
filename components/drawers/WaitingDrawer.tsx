/**
 * WaitingDrawer - "Finding driver" status
 * Uses delayed opening animation for smooth transitions
 */
import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useRideStore } from '@/store/rideStore';
import { DRAWER_OPEN_DELAY, SPRING_CONFIG_OPEN, SPRING_CONFIG_CLOSE } from '@/constants/animations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WaitingDrawerProps {
  isOpen: boolean;
  onCancel: () => void;
  onViewDetails: () => void;
}

export default function WaitingDrawer({ isOpen, onCancel, onViewDetails }: WaitingDrawerProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { bookedRide, selectedPaymentMethod } = useRideStore();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const rippleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    let openTimeout: ReturnType<typeof setTimeout>;
    let pulse: Animated.CompositeAnimation;

    if (isOpen) {
      // Reset to bottom position immediately (no flash since component just mounted)
      slideAnim.setValue(SCREEN_HEIGHT);
      // Delay opening to let previous drawer slide down first
      openTimeout = setTimeout(() => {
        Animated.spring(slideAnim, { toValue: 0, ...SPRING_CONFIG_OPEN }).start();
        // Start pulse animation
        pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.15, duration: 1400, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
          ])
        );
        pulse.start();
      }, DRAWER_OPEN_DELAY);
    } else {
      Animated.spring(slideAnim, { toValue: SCREEN_HEIGHT, ...SPRING_CONFIG_CLOSE }).start();
    }

    return () => {
      if (openTimeout) clearTimeout(openTimeout);
      if (pulse) pulse.stop();
    };
  }, [isOpen]);

  if (!isOpen || !bookedRide) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: '#FFFFFF', paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* Status Section */}
      <View style={styles.statusSection}>
        <Animated.View style={[styles.pulseOuter, { backgroundColor: colors.accentDim, transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.pulseInner, { backgroundColor: colors.accent }]}>
            <Ionicons name="car" size={28} color="#000" />
          </View>
        </Animated.View>
        <Text style={[styles.statusTitle, { color: colors.text }]}>Finding your driver</Text>
        <Text style={[styles.statusSubtitle, { color: colors.textSub }]}>Please wait while we connect you...</Text>
      </View>

      {/* Ride Info */}
      <View style={[styles.rideCard, { backgroundColor: '#FFFFFF', borderColor: colors.border }]}>
        <View style={styles.rideRow}>
          <View style={styles.rideLeft}>
            <Text style={[styles.rideLabel, { color: colors.textSub }]}>From</Text>
            <Text style={[styles.rideValue, { color: colors.text }]} numberOfLines={1}>{bookedRide.pickup}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.rideRow}>
          <View style={styles.rideLeft}>
            <Text style={[styles.rideLabel, { color: colors.textSub }]}>To</Text>
            <Text style={[styles.rideValue, { color: colors.text }]} numberOfLines={1}>{bookedRide.drop}</Text>
          </View>
        </View>
      </View>

      {/* Payment & Price */}
      <View style={styles.paymentRow}>
        <View style={styles.paymentLeft}>
          <Ionicons name={selectedPaymentMethod === 'cash' ? 'cash-outline' : 'card-outline'} size={20} color={colors.accent} />
          <Text style={[styles.paymentText, { color: colors.text }]}>{selectedPaymentMethod === 'cash' ? 'Cash' : 'Card'}</Text>
        </View>
        <Text style={[styles.priceText, { color: colors.text }]}>{bookedRide.price}/km</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.detailsButton, { borderColor: colors.border }]} onPress={onViewDetails}>
          <Ionicons name="information-circle-outline" size={20} color={colors.text} />
          <Text style={[styles.detailsButtonText, { color: colors.text }]}>Ride Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.accent }]} onPress={onCancel}>
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
    // Premium shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 40,
  },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
  statusSection: { alignItems: 'center', marginBottom: 24 },
  pulseOuter: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  pulseInner: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  statusTitle: { fontSize: 20, fontWeight: '700' },
  statusSubtitle: { fontSize: 14, marginTop: 4 },
  rideCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  rideRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rideLeft: { flex: 1 },
  rideLabel: { fontSize: 12 },
  rideValue: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  divider: { height: 1 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paymentText: { fontSize: 15, fontWeight: '500' },
  priceText: { fontSize: 18, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  detailsButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  detailsButtonText: { fontSize: 14, fontWeight: '600' },
  cancelButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
