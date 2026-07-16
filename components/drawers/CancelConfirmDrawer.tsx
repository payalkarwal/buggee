/**
 * CancelConfirmDrawer - Final cancellation confirmation
 */
import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useRideStore } from '@/store/rideStore';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CancelConfirmDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onWaitForDriver: () => void;
}

export default function CancelConfirmDrawer({ isOpen, onClose, onConfirm, onWaitForDriver }: CancelConfirmDrawerProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { selectedCancelReason } = useRideStore();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: SCREEN_HEIGHT, tension: 55, friction: 14, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.container, { backgroundColor: colors.modalBg, paddingBottom: Math.max(insets.bottom, 40), transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Warning Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconOuter, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="warning" size={32} color="#E53935" />
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={[styles.title, { color: colors.text }]}>Cancel this ride?</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>
          Your driver is on the way. Are you sure you want to cancel?
        </Text>

        {/* Selected Reason */}
        {selectedCancelReason && (
          <View style={[styles.reasonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.reasonLabel, { color: colors.textSub }]}>Reason</Text>
            <Text style={[styles.reasonText, { color: colors.text }]}>{selectedCancelReason}</Text>
          </View>
        )}

        {/* Warning Text */}
        <View style={[styles.warningCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.warningText}>Frequent cancellations may affect your rider rating</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.waitButton, { borderColor: colors.border }]} onPress={onWaitForDriver}>
            <Ionicons name="time-outline" size={20} color={colors.text} />
            <Text style={[styles.waitButtonText, { color: colors.text }]}>Wait for Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.confirmButton, { backgroundColor: '#E53935' }]} onPress={handleConfirm}>
            <Ionicons name="close" size={20} color="#FFF" />
            <Text style={styles.confirmButtonText}>Yes, Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 998 },
  backdrop: { flex: 1 },
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
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  iconOuter: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  reasonCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  reasonLabel: { fontSize: 12, marginBottom: 4 },
  reasonText: { fontSize: 15, fontWeight: '600' },
  warningCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 24 },
  warningText: { flex: 1, fontSize: 13, color: '#E65100' },
  actions: { flexDirection: 'row', gap: 12 },
  waitButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1 },
  waitButtonText: { fontSize: 14, fontWeight: '700' },
  confirmButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  confirmButtonText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
