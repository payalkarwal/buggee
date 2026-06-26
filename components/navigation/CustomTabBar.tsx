import React, { useCallback, useState } from 'react';
import { Animated, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/context/ThemeContext';

export interface CustomTabBarProps {
  activeTab: 'home' | 'bookings' | 'profile';
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
}

export default function CustomTabBar({ activeTab, style }: CustomTabBarProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('Arjun Kumar');

  // Synchronize state when screen is focused
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('buggee_profile').then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.image) setUserImage(saved.image);
          if (saved.name) setUserName(saved.name);
        }
      });
    }, [])
  );

  const initials = () => {
    const parts = userName.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  };

  const isProfileActive = activeTab === 'profile';

  return (
    <Animated.View
      style={[
        styles.customTabBar,
        {
          backgroundColor: isDark
            ? 'rgba(20,20,20,0.95)'
            : 'rgba(255,255,255,0.95)',
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => activeTab !== 'home' && router.replace(ROUTES.HOME)}
      >
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={29}
          color={activeTab === 'home' ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#757575' : '#8E8E93')}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => activeTab !== 'bookings' && router.replace(ROUTES.BOOKINGS)}
      >
        <Ionicons
          name={activeTab === 'bookings' ? 'receipt' : 'receipt-outline'}
          size={29}
          color={activeTab === 'bookings' ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#757575' : '#8E8E93')}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => activeTab !== 'profile' && router.replace(ROUTES.PROFILE)}
      >
        <View
          style={[
            styles.profileTabCircle,
            isProfileActive
              ? { borderColor: isDark ? '#FFFFFF' : '#000000', borderWidth: 2 }
              : { borderColor: 'transparent', borderWidth: 2 }
          ]}
        >
          {userImage ? (
            <Image
              source={{ uri: userImage }}
              style={styles.profileTabImg}
              contentFit="cover"
            />
          ) : (
            <Text
              style={[
                styles.profileTabInitial,
                { color: isProfileActive ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#757575' : '#8E8E93') }
              ]}
            >
              {initials()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  customTabBar: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    width: '75%',
    maxWidth: 330,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 55,
  },
  profileTabCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTabImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  profileTabInitial: {
    fontSize: 13,
    fontWeight: '800',
  },
});
