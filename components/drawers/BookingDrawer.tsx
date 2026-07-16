/**
 * BookingDrawer - Pickup/Drop location selection
 * Uses delayed opening animation for smooth transitions
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useRideStore } from '@/store/rideStore';
import { tierDetails } from '@/constants/rideTiers';
import { DRAWER_OPEN_DELAY, SPRING_CONFIG_OPEN, SPRING_CONFIG_CLOSE } from '@/constants/animations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLocationDrawer: (type: 'pickup' | 'drop') => void;
  onRequestRide: () => void;
}

export default function BookingDrawer({ isOpen, onClose, onOpenLocationDrawer, onRequestRide }: BookingDrawerProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { selectedTier, getTierLocation } = useRideStore();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const currentPickup = selectedTier ? getTierLocation(selectedTier, 'pickup') : '';
  const currentDrop = selectedTier ? getTierLocation(selectedTier, 'drop') : '';

  React.useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }).start();
    } else {
      Animated.spring(slideAnim, { toValue: SCREEN_HEIGHT, tension: 55, friction: 14, useNativeDriver: true }).start();
    }
  }, [isOpen]);

  if (!isOpen || !selectedTier) return null;

  const details = tierDetails[selectedTier];
  const TierIcon = selectedTier === 'Standard' ? 'car-side' : selectedTier === 'Delux' ? 'car-sports' : 'crown';

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.modalBg, paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />
      <View style={styles.content}>
        <TouchableOpacity onPress={onClose} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Tier Header */}
        <View style={[styles.tierHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconOuter, { backgroundColor: colors.accentDim }]}>
            <MaterialCommunityIcons name={TierIcon} size={32} color={colors.accent} />
          </View>
          <View style={styles.tierInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.tierName, { color: colors.text }]}>{details.name}</Text>
              {selectedTier === 'Delux' && (
                <View style={[styles.tag, { backgroundColor: colors.accentDim }]}>
                  <Ionicons name="star" size={10} color={colors.accent} />
                  <Text style={[styles.tagText, { color: colors.accent }]}>Popular</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tierDesc, { color: colors.textSub }]}>{details.desc}</Text>
            <View style={styles.priceRow}>
              <Ionicons name="cash-outline" size={14} color={colors.accent} />
              <Text style={[styles.priceText, { color: colors.text }]}>{details.price}/km</Text>
            </View>
          </View>
        </View>

        {/* Location Selection */}
        <View style={styles.locationSection}>
          <TouchableOpacity style={styles.locationRow} onPress={() => onOpenLocationDrawer('pickup')}>
            <View style={styles.locationLeft}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <View>
                <Text style={[styles.locationLabel, { color: colors.textSub }]}>Pickup location</Text>
                <Text style={[styles.locationValue, { color: currentPickup ? colors.text : colors.textSub }]}>
                  {currentPickup || 'Enter pickup location'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
          </TouchableOpacity>

          <View style={styles.routeLine}>
            <View style={[styles.routeLinePath, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity style={styles.locationRow} onPress={() => onOpenLocationDrawer('drop')}>
            <View style={styles.locationLeft}>
              <View style={[styles.square, { borderColor: '#E53935' }]} />
              <View>
                <Text style={[styles.locationLabel, { color: colors.textSub }]}>Drop off location</Text>
                <Text style={[styles.locationValue, { color: currentDrop ? colors.text : colors.textSub }]}>
                  {currentDrop || 'Where to?'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
          </TouchableOpacity>
        </View>

        {/* Request Button */}
        <TouchableOpacity
          style={[styles.requestButton, { backgroundColor: colors.accent, opacity: currentPickup && currentDrop ? 1 : 0.5 }]}
          onPress={onRequestRide}
          disabled={!currentPickup || !currentDrop}
        >
          <Text style={styles.requestButtonText}>Request Ride</Text>
          <Ionicons name="arrow-forward" size={20} color="#000" />
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
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  content: {},
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  tierHeader: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  iconOuter: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  tierInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierName: { fontSize: 18, fontWeight: '700' },
  tierDesc: { fontSize: 13, marginTop: 2 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagText: { fontSize: 10, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  priceText: { fontSize: 14, fontWeight: '600' },
  locationSection: { marginBottom: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  locationLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  square: { width: 12, height: 12, borderWidth: 2, borderRadius: 2 },
  locationLabel: { fontSize: 12 },
  locationValue: { fontSize: 15, fontWeight: '500', marginTop: 2 },
  routeLine: { paddingLeft: 5, height: 24 },
  routeLinePath: { width: 2, height: '100%', marginLeft: 5 },
  requestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  requestButtonText: { fontSize: 16, fontWeight: '700', color: '#000' },
});
