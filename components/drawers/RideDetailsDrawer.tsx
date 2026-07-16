/**
 * RideDetailsDrawer - Full ride details with payment options
 */
import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useRideStore } from '@/store/rideStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RideDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RideDetailsDrawer({ isOpen, onClose }: RideDetailsDrawerProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { bookedRide, selectedPaymentMethod, setSelectedPaymentMethod, shareTripEnabled, setShareTripEnabled, routeInfo } = useRideStore();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }).start();
    } else {
      Animated.spring(slideAnim, { toValue: SCREEN_HEIGHT, tension: 55, friction: 14, useNativeDriver: true }).start();
    }
  }, [isOpen]);

  if (!isOpen || !bookedRide) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.modalBg, paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ride Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Route Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <View style={styles.routeInfo}>
              <Text style={[styles.routeLabel, { color: colors.textSub }]}>Pickup</Text>
              <Text style={[styles.routeValue, { color: colors.text }]} numberOfLines={2}>{bookedRide.pickup}</Text>
            </View>
          </View>
          <View style={styles.routeLine}>
            <View style={[styles.routeLinePath, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.routeRow}>
            <View style={[styles.square, { borderColor: '#E53935' }]} />
            <View style={styles.routeInfo}>
              <Text style={[styles.routeLabel, { color: colors.textSub }]}>Drop off</Text>
              <Text style={[styles.routeValue, { color: colors.text }]} numberOfLines={2}>{bookedRide.drop}</Text>
            </View>
          </View>
          {routeInfo && (
            <View style={[styles.distanceRow, { borderTopColor: colors.border }]}>
              <View style={styles.distanceItem}>
                <Ionicons name="speedometer-outline" size={18} color={colors.textSub} />
                <Text style={[styles.distanceText, { color: colors.text }]}>{routeInfo.distance}</Text>
              </View>
              <View style={styles.distanceItem}>
                <Ionicons name="time-outline" size={18} color={colors.textSub} />
                <Text style={[styles.distanceText, { color: colors.text }]}>{routeInfo.duration}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.paymentOption, selectedPaymentMethod === 'cash' && styles.paymentOptionActive, { borderColor: selectedPaymentMethod === 'cash' ? colors.accent : colors.border }]}
            onPress={() => setSelectedPaymentMethod('cash')}
          >
            <Ionicons name="cash-outline" size={24} color={selectedPaymentMethod === 'cash' ? colors.accent : colors.textSub} />
            <Text style={[styles.paymentOptionText, { color: colors.text }]}>Cash</Text>
            {selectedPaymentMethod === 'cash' && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentOption, selectedPaymentMethod === 'card' && styles.paymentOptionActive, { borderColor: selectedPaymentMethod === 'card' ? colors.accent : colors.border }]}
            onPress={() => setSelectedPaymentMethod('card')}
          >
            <Ionicons name="card-outline" size={24} color={selectedPaymentMethod === 'card' ? colors.accent : colors.textSub} />
            <Text style={[styles.paymentOptionText, { color: colors.text }]}>Card</Text>
            {selectedPaymentMethod === 'card' && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
          </TouchableOpacity>
        </View>

        {/* Share Trip */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.shareRow}>
            <View style={styles.shareLeft}>
              <Ionicons name="share-social-outline" size={24} color={colors.textSub} />
              <View>
                <Text style={[styles.shareTitle, { color: colors.text }]}>Share Trip</Text>
                <Text style={[styles.shareSubtitle, { color: colors.textSub }]}>Let friends track your ride</Text>
              </View>
            </View>
            <Switch
              value={shareTripEnabled}
              onValueChange={setShareTripEnabled}
              trackColor={{ false: colors.border, true: colors.accentDim }}
              thumbColor={shareTripEnabled ? colors.accent : colors.textSub}
            />
          </View>
        </View>

        {/* Price */}
        <View style={[styles.priceCard, { backgroundColor: colors.accentDim }]}>
          <Text style={[styles.priceLabel, { color: colors.accent }]}>Estimated Fare</Text>
          <Text style={[styles.priceValue, { color: colors.accent }]}>{bookedRide.price}/km</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.85,
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  square: { width: 12, height: 12, borderWidth: 2, borderRadius: 2, marginTop: 4 },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 12 },
  routeValue: { fontSize: 15, fontWeight: '500', marginTop: 2 },
  routeLine: { paddingLeft: 5, height: 20 },
  routeLinePath: { width: 2, height: '100%', marginLeft: 5 },
  distanceRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, marginTop: 16, borderTopWidth: 1 },
  distanceItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distanceText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  paymentOptionActive: { borderWidth: 2 },
  paymentOptionText: { flex: 1, fontSize: 15, fontWeight: '500' },
  shareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shareLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  shareTitle: { fontSize: 15, fontWeight: '600' },
  shareSubtitle: { fontSize: 12, marginTop: 2 },
  priceCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  priceLabel: { fontSize: 13, fontWeight: '600' },
  priceValue: { fontSize: 28, fontWeight: '800', marginTop: 4 },
});
