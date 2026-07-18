/**
 * CancelReasonsDrawer - Select cancellation reason
 * Uses delayed opening animation for smooth transitions
 */
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, ScrollView, TextInput, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useRideStore } from '@/store/rideStore';
import { CANCEL_REASONS } from '@/constants/cancelReasons';
import { DRAWER_OPEN_DELAY, SPRING_CONFIG_OPEN, SPRING_CONFIG_CLOSE, FADE_IN_CONFIG, FADE_OUT_CONFIG } from '@/constants/animations';
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
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Handle keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to bottom to show the input
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    let openTimeout: ReturnType<typeof setTimeout>;

    if (isOpen) {
      // Reset to bottom position immediately (no flash since component just mounted)
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      // Delay opening to let previous drawer slide down first
      openTimeout = setTimeout(() => {
        Animated.parallel([
          Animated.spring(slideAnim, { toValue: 0, ...SPRING_CONFIG_OPEN }),
          Animated.timing(fadeAnim, FADE_IN_CONFIG),
        ]).start();
      }, DRAWER_OPEN_DELAY);
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: SCREEN_HEIGHT, ...SPRING_CONFIG_CLOSE }),
        Animated.timing(fadeAnim, FADE_OUT_CONFIG),
      ]).start();
    }

    return () => {
      if (openTimeout) clearTimeout(openTimeout);
    };
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

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (showCustomReasonInput) {
      // If custom reason input is showing, go back to reason list
      Keyboard.dismiss();
      setCustomReason('');
      setShowCustomReasonInput(false);
    } else {
      // Otherwise close the drawer
      onClose();
    }
  };

  if (!isOpen) return null;

  // Calculate max height - leave space for keyboard + some top margin
  const maxDrawerHeight = SCREEN_HEIGHT - (keyboardHeight > 0 ? keyboardHeight : 0) - 60;

  return (
    <>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.modalBg,
            paddingBottom: keyboardHeight > 0 ? 20 : Math.max(insets.bottom, 40),
            transform: [{ translateY: slideAnim }],
            maxHeight: maxDrawerHeight,
            bottom: keyboardHeight > 0 ? keyboardHeight : 0,
          }
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
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
                autoFocus
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
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

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.keepRideButton, { backgroundColor: '#FFFFFF', borderColor: colors.border, borderWidth: 1 }]}
              onPress={onClose}
            >
              <Ionicons name="car" size={18} color="#000000" />
              <Text style={[styles.keepRideButtonText, { color: '#000000' }]}>Keep My Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.skipButton, { backgroundColor: '#FFFFFF', borderColor: colors.border, borderWidth: 1 }]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipButtonText, { color: '#000000' }]}>{showCustomReasonInput ? 'Back' : 'Skip'}</Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    flexGrow: 1,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  keepRideButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  keepRideButtonText: { fontSize: 14, fontWeight: '700' },
  skipButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  skipButtonText: { fontSize: 14, fontWeight: '700', color: '#000' },
});
