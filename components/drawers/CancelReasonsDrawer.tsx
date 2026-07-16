/**
 * CancelReasonsDrawer - Select cancellation reason
 */
import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, ScrollView, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useRideStore } from '@/store/rideStore';
import { CANCEL_REASONS } from '@/constants/cancelReasons';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CancelReasonsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReason: (reason: string) => void;
}

export default function CancelReasonsDrawer({ isOpen, onClose, onSelectReason }: CancelReasonsDrawerProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { showCustomReasonInput, setShowCustomReasonInput, customReason, setCustomReason } = useRideStore();
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

  const handleSelectReason = (reason: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (reason === 'Other reason') {
      setShowCustomReasonInput(true);
    } else {
      onSelectReason(reason);
    }
  };

  const handleSubmitCustomReason = () => {
    if (customReason.trim()) {
      Keyboard.dismiss();
      onSelectReason(customReason.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.container, { backgroundColor: colors.modalBg, paddingBottom: Math.max(insets.bottom, 40), transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>Why do you want to cancel?</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>Help us improve by selecting a reason</Text>

          <View style={styles.reasonsList}>
            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[styles.reasonItem, { borderColor: colors.border, opacity: showCustomReasonInput && reason.id !== 'other' ? 0.5 : 1 }]}
                onPress={() => handleSelectReason(reason.text)}
                disabled={showCustomReasonInput && reason.id !== 'other'}
              >
                <View style={[styles.reasonIcon, { backgroundColor: colors.surface }]}>
                  <Ionicons name={reason.icon as any} size={22} color={colors.textSub} />
                </View>
                <Text style={[styles.reasonText, { color: colors.text }]}>{reason.text}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
              </TouchableOpacity>
            ))}
          </View>

          {showCustomReasonInput && (
            <View style={styles.customReasonContainer}>
              <Text style={[styles.customReasonLabel, { color: colors.text }]}>Please specify your reason:</Text>
              <TextInput
                style={[styles.customReasonInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Write your reason here..."
                placeholderTextColor={colors.textSub}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.accent, opacity: customReason.trim() ? 1 : 0.5 }]}
                onPress={handleSubmitCustomReason}
                disabled={!customReason.trim()}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 20 },
  reasonsList: { marginBottom: 20 },
  reasonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, gap: 14 },
  reasonIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  reasonText: { flex: 1, fontSize: 15, fontWeight: '500' },
  customReasonContainer: { marginBottom: 20 },
  customReasonLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  customReasonInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 100, marginBottom: 14 },
  submitButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#000' },
});
