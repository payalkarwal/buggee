/**
 * TierSelectionDrawer - Shows tier details when user taps info
 * Uses delayed opening animation for smooth transitions
 */
import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useRideStore } from '@/store/rideStore';
import { tierDetails } from '@/constants/rideTiers';
import { useDrawerAnimation } from '@/hooks/useDrawerAnimation';
import { DRAWER_OPEN_DELAY, SPRING_CONFIG_OPEN, SPRING_CONFIG_CLOSE, FADE_IN_CONFIG, FADE_OUT_CONFIG } from '@/constants/animations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TierSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TierSelectionDrawer({ isOpen, onClose }: TierSelectionDrawerProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { selectedTier } = useRideStore();
  const { slideAnim, fadeAnim } = useDrawerAnimation({ onClose });

  React.useEffect(() => {
    let openTimeout: ReturnType<typeof setTimeout>;

    if (isOpen) {
      // Reset to bottom position immediately (no flash since component just mounted)
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      // Delay opening to let "Choose Your Ride" slide down first
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

  if (!isOpen || !selectedTier) return null;

  const details = tierDetails[selectedTier];
  const TierIcon = selectedTier === 'Standard' ? 'car-side' : selectedTier === 'Delux' ? 'car-sports' : 'crown';

  return (
    <>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.modalBg,
            paddingBottom: Math.max(insets.bottom, 20),
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name={TierIcon} size={32} color={isDark ? '#FFF' : '#000'} style={{ marginRight: 12 }} />
              <View>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.accent }]}>{details.name}</Text>
                  {selectedTier === 'Delux' && (
                    <View style={[styles.badge, { backgroundColor: colors.accentDim }]}>
                      <Text style={[styles.badgeText, { color: colors.text }]}>Popular</Text>
                    </View>
                  )}
                  {selectedTier === 'VIP' && (
                    <View style={[styles.badge, { borderColor: colors.accentDim, borderWidth: 1 }]}>
                      <Ionicons name="star" size={10} color={colors.accent} />
                    </View>
                  )}
                </View>
                <Text style={[styles.subtitle, { color: colors.textSub }]}>{details.desc}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.aboutTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.aboutDesc, { color: colors.textSub }]}>{details.detailDesc}</Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 998 },
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
  content: { paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginRight: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  aboutCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  aboutTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  aboutDesc: { fontSize: 14, lineHeight: 20 },
});
