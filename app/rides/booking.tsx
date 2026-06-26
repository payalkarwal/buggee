import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const tierDetails = {
  Standard: {
    name: 'Standard',
    icon: 'car-side' as const,
    desc: 'Comfortable, budget-friendly everyday rides.',
    price: '₹ 49',
    capacity: '4 seats',
    eta: '4 mins',
  },
  Delux: {
    name: 'Delux',
    icon: 'car-sports' as const,
    desc: 'Premium comfort and extra space.',
    price: '₹ 79',
    capacity: '4 seats',
    eta: '2 mins',
  },
  VIP: {
    name: 'VIP',
    icon: 'crown' as const,
    desc: 'Elite luxury experience with top chauffeurs.',
    price: '₹ 129',
    capacity: '6 seats',
    eta: '1 min',
  },
};

export default function BookingScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams();
  const tier = (params.tier as 'Standard' | 'Delux' | 'VIP') || 'Standard';
  const details = tierDetails[tier];

  const [pickup, setPickup] = useState('Current Location');
  const [drop, setDrop] = useState('');
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const [isEditingDrop, setIsEditingDrop] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleConfirmRide = () => {
    if (!drop.trim()) {
      Alert.alert('Missing Information', 'Please enter a drop-off location.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    router.push('/(tabs)/bookings');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Book Ride</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Ride Card */}
        <View style={[styles.rideCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rideCardHeader}>
            <View style={styles.rideCardLeft}>
              <MaterialCommunityIcons name={details.icon} size={28} color={colors.accent} />
              <View style={styles.rideCardInfo}>
                <Text style={[styles.rideCardTitle, { color: colors.text }]}>{details.name}</Text>
                <Text style={[styles.rideCardDesc, { color: colors.textSub }]}>{details.capacity}</Text>
              </View>
            </View>
            <View style={styles.rideCardRight}>
              <Text style={[styles.rideCardPrice, { color: colors.text }]}>{details.price}</Text>
              <Text style={[styles.rideCardPriceUnit, { color: colors.textSub }]}>/km</Text>
            </View>
          </View>
          <View style={[styles.etaBadge, { backgroundColor: colors.accentDim }]}>
            <Ionicons name="time-outline" size={14} color={colors.accent} />
            <Text style={[styles.etaText, { color: colors.text }]}>Arrives in {details.eta}</Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Trip Details</Text>

          {/* Pickup */}
          <View style={styles.locationRow}>
            <View style={styles.locationIconContainer}>
              <View style={[styles.locationDot, { backgroundColor: colors.accent }]} />
              <View style={[styles.locationLine, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.locationInputContainer}>
              <Text style={[styles.locationLabel, { color: colors.textSub }]}>Pickup</Text>
              {isEditingPickup ? (
                <View style={styles.locationEditRow}>
                  <TextInput
                    style={[styles.locationInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                    value={pickup}
                    onChangeText={setPickup}
                    placeholder="Enter pickup location"
                    placeholderTextColor={colors.textSub}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setIsEditingPickup(false)}
                    style={[styles.doneButton, { backgroundColor: colors.accent }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.locationDisplayRow}>
                  <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                    {pickup}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsEditingPickup(true)}
                    style={[styles.editButton, { borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.editButtonText, { color: colors.accent }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Drop */}
          <View style={styles.locationRow}>
            <View style={styles.locationIconContainer}>
              <View style={[styles.locationDotDrop, { backgroundColor: '#E53935', borderColor: colors.card }]} />
            </View>
            <View style={styles.locationInputContainer}>
              <Text style={[styles.locationLabel, { color: colors.textSub }]}>Drop-off</Text>
              {isEditingDrop ? (
                <View style={styles.locationEditRow}>
                  <TextInput
                    style={[styles.locationInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                    value={drop}
                    onChangeText={setDrop}
                    placeholder="Enter drop-off location"
                    placeholderTextColor={colors.textSub}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setIsEditingDrop(false)}
                    style={[styles.doneButton, { backgroundColor: colors.accent }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.locationDisplayRow}>
                  <Text
                    style={[styles.locationText, { color: drop ? colors.text : colors.textSub }]}
                    numberOfLines={1}
                  >
                    {drop || 'Enter destination'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsEditingDrop(true)}
                    style={[styles.editButton, { borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.editButtonText, { color: colors.accent }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Payment Section */}
        <View style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons name="wallet-outline" size={22} color={colors.accent} />
              <Text style={[styles.paymentText, { color: colors.text }]}>Cash Payment</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.accent }]}
          onPress={handleConfirmRide}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmButtonText, { color: '#000' }]}>Confirm Ride</Text>
          <Ionicons name="checkmark-circle" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Professional Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        animationType="fade"
        transparent
        onRequestClose={handleConfirmationClose}
      >
        <View style={[styles.confirmationOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.confirmationCard, { backgroundColor: colors.modalBg, borderColor: colors.border }]}>
            {/* Success Icon */}
            <View style={[styles.successIconContainer, { backgroundColor: colors.accentDim }]}>
              <View style={[styles.successIconInner, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark" size={36} color="#000" />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.confirmationTitle, { color: colors.text }]}>Ride Confirmed!</Text>
            <Text style={[styles.confirmationSubtitle, { color: colors.textSub }]}>
              Your {details.name} ride has been successfully booked
            </Text>

            {/* Details */}
            <View style={[styles.confirmationDetails, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.confirmationRow}>
                <Text style={[styles.confirmationLabel, { color: colors.textSub }]}>Ride Type</Text>
                <Text style={[styles.confirmationValue, { color: colors.text }]}>{details.name}</Text>
              </View>
              <View style={[styles.confirmationDivider, { backgroundColor: colors.border }]} />
              <View style={styles.confirmationRow}>
                <Text style={[styles.confirmationLabel, { color: colors.textSub }]}>Pickup</Text>
                <Text style={[styles.confirmationValue, { color: colors.text }]} numberOfLines={1}>
                  {pickup}
                </Text>
              </View>
              <View style={[styles.confirmationDivider, { backgroundColor: colors.border }]} />
              <View style={styles.confirmationRow}>
                <Text style={[styles.confirmationLabel, { color: colors.textSub }]}>Drop-off</Text>
                <Text style={[styles.confirmationValue, { color: colors.text }]} numberOfLines={1}>
                  {drop}
                </Text>
              </View>
              <View style={[styles.confirmationDivider, { backgroundColor: colors.border }]} />
              <View style={styles.confirmationRow}>
                <Text style={[styles.confirmationLabel, { color: colors.textSub }]}>ETA</Text>
                <Text style={[styles.confirmationValue, { color: colors.accent }]}>{details.eta}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              onPress={handleConfirmationClose}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryButtonText, { color: '#000' }]}>View My Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleConfirmationClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textSub }]}>Close</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  rideCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  rideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rideCardInfo: {},
  rideCardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  rideCardDesc: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  rideCardRight: {
    alignItems: 'flex-end',
  },
  rideCardPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  rideCardPriceUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  etaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  locationIconContainer: {
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 4,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationDotDrop: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  locationLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  locationInputContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  locationDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  doneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
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
  confirmationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
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
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmationDetails: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmationLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1.5,
    textAlign: 'right',
  },
  confirmationDivider: {
    height: 1,
    marginVertical: 4,
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
