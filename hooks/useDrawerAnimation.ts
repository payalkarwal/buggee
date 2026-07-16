/**
 * useDrawerAnimation Hook
 * Reusable drawer animation logic for all bottom sheets
 * Eliminates 300+ lines of duplicated animation code
 */

import { useRef, useCallback } from 'react';
import { Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  SPRING_CONFIG_OPEN,
  SPRING_CONFIG_CLOSE,
  FADE_IN_CONFIG,
  FADE_OUT_CONFIG,
} from '@/constants/animations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UseDrawerAnimationConfig {
  onOpen?: () => void;
  onClose?: () => void;
  onAnimationComplete?: () => void;
}

export function useDrawerAnimation(config: UseDrawerAnimationConfig = {}) {
  const { onOpen, onClose, onAnimationComplete } = config;

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /**
   * Open drawer with spring + fade animation
   */
  const open = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onOpen) {
      onOpen();
    }

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        ...SPRING_CONFIG_OPEN,
      }),
      Animated.timing(fadeAnim, FADE_IN_CONFIG),
    ]).start();
  }, [slideAnim, fadeAnim, onOpen]);

  /**
   * Close drawer with spring + fade animation
   * Calls onAnimationComplete callback after animation finishes
   */
  const close = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onClose) {
      onClose();
    }

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        ...SPRING_CONFIG_CLOSE,
      }),
      Animated.timing(fadeAnim, FADE_OUT_CONFIG),
    ]).start(() => {
      // Callback after animation completes
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [slideAnim, fadeAnim, onClose, onAnimationComplete]);

  return {
    slideAnim,
    fadeAnim,
    open,
    close,
  };
}
