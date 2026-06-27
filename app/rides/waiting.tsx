import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export default function WaitingScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();
  const tier = (params.tier as 'Standard' | 'Delux' | 'VIP') || 'Standard';
  const pickup = (params.pickup as string) || 'Current Location';
  const drop = (params.drop as string) || 'Destination';

  const [showDetails, setShowDetails] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const detailsSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
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
  }, []);

  const toggleDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDetails(!showDetails);
    Animated.spring(detailsSlideAnim, {
      toValue: showDetails ? SCREEN_HEIGHT : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowCancelModal(false);
    router.push('/(tabs)');
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Finding Your Ride</Text>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons name={tierIcons[tier]} size={14} color={colors.accent} />
            <Text style={[styles.headerBadgeText, { color: colors.text }]}>{tier}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.ripple,
              {
                borderColor: colors.accent,
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
              styles.loadingCircle,
              { backgroundColor: colors.accentDim, borderColor: colors.accent, transform: [{ scale: pulseAnim }] },
            ]}
          >
            <MaterialCommunityIcons name={tierIcons[tier]} size={48} color={colors.accent} />
          </Animated.View>
        </View>

        {/* Status Text */}
        <Text style={[styles.statusTitle, { color: colors.text }]}>Searching for a Driver</Text>
        <Text style={[styles.statusSubtitle, { color: colors.textSub }]}>
          Please wait while we connect you with a nearby driver
        </Text>

        {/* Trip Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Trip Details</Text>
            <TouchableOpacity
              onPress={toggleDetails}
              style={[styles.detailsButton, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryContent}>
            {/* Pickup */}
            <View style={styles.locationRow}>
              <View style={[styles.locationDotContainer, { backgroundColor: colors.accentDim }]}>
                <View style={[styles.locationDot, { backgroundColor: colors.accent }]} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationLabel, { color: colors.textSub }]}>Pickup</Text>
                <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={2}>
                  {pickup}
                </Text>
              </View>
            </View>

            {/* Connector */}
            <View style={[styles.locationConnector, { backgroundColor: colors.border }]} />

            {/* Drop */}
            <View style={styles.locationRow}>
              <View style={[styles.locationDotContainer, { backgroundColor: '#FFE5E5' }]}>
                <View style={[styles.locationDot, { backgroundColor: '#E53935' }]} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationLabel, { color: colors.textSub }]}>Destination</Text>
                <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={2}>
                  {drop}
                </Text>
              </View>
            </View>
          </View>

          {/* Fare */}
          <View style={[styles.fareSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.fareLabel, { color: colors.textSub }]}>Estimated Fare</Text>
            <Text style={[styles.fareAmount, { color: colors.text }]}>{tierPrices[tier]}</Text>
          </View>

          {/* Instruction */}
          <View style={[styles.instructionCard, { backgroundColor: colors.accentDim }]}>
            <Ionicons name="information-circle" size={20} color={colors.accent} />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Meet your driver at the pickup location
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: '#FEE', borderColor: '#E53935' }]}
          onPress={handleCancel}
          activeOpacity={0.85}
        >
          <Ionicons name="close-circle" size={22} color="#E53935" />
          <Text style={[styles.cancelButtonText, { color: '#E53935' }]}>Cancel Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.closeButtonFooter, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleClose}
          activeOpacity={0.85}
        >
          <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Trip Details Modal */}
      <Modal visible={showDetails} animationType="slide" transparent onRequestClose={toggleDetails}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={toggleDetails} />
          <Animated.View
            style={[
              styles.detailsDrawer,
              { backgroundColor: colors.modalBg, borderColor: colors.border, transform: [{ translateY: detailsSlideAnim }] },
            ]}
          >
            <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.detailsTitle, { color: colors.text }]}>Complete Trip Details</Text>

            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSub }]}>Ride Type</Text>
              <View style={styles.detailValue}>
                <MaterialCommunityIcons name={tierIcons[tier]} size={18} color={colors.accent} />
                <Text style={[styles.detailText, { color: colors.text }]}>{tier}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSub }]}>From</Text>
              <Text style={[styles.detailText, { color: colors.text }]} numberOfLines={2}>
                {pickup}
              </Text>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSub }]}>To</Text>
              <Text style={[styles.detailText, { color: colors.text }]} numberOfLines={2}>
                {drop}
              </Text>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: 'transparent' }]}>
              <Text style={[styles.detailLabel, { color: colors.textSub }]}>Estimated Fare</Text>
              <Text style={[styles.detailAmount, { color: colors.accent }]}>{tierPrices[tier]}</Text>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.accent }]}
              onPress={toggleDetails}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalCloseButtonText, { color: '#000' }]}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal visible={showCancelModal} animationType="fade" transparent onRequestClose={() => setShowCancelModal(false)}>
        <View style={[styles.cancelModalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.cancelModalContent, { backgroundColor: colors.modalBg, borderColor: colors.border }]}>
            <View style={[styles.cancelIconContainer, { backgroundColor: '#FEE' }]}>
              <Ionicons name="alert-circle" size={48} color="#E53935" />
            </View>

            <Text style={[styles.cancelModalTitle, { color: colors.text }]}>Cancel This Ride?</Text>
            <Text style={[styles.cancelModalSubtitle, { color: colors.textSub }]}>
              Are you sure you want to cancel this ride request? You can always book another ride.
            </Text>

            <TouchableOpacity
              style={[styles.confirmCancelButton, { backgroundColor: '#E53935' }]}
              onPress={confirmCancel}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmCancelButtonText, { color: '#FFF' }]}>Yes, Cancel Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepRideButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCancelModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.keepRideButtonText, { color: colors.text }]}>Keep Ride</Text>
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  ripple: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  loadingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  locationDotContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  locationConnector: {
    width: 2,
    height: 20,
    marginLeft: 21,
    marginVertical: 4,
  },
  fareSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 16,
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: '900',
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeButtonFooter: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  detailsDrawer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    borderTopWidth: 1,
  },
  drawerHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1.5,
    textAlign: 'right',
  },
  detailAmount: {
    fontSize: 20,
    fontWeight: '900',
  },
  modalCloseButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cancelModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cancelModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 12,
    textAlign: 'center',
  },
  cancelModalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  confirmCancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmCancelButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  keepRideButton: {
    paddingVertical: 12,
  },
  keepRideButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
