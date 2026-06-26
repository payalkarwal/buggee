import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import BookingCard from '@/components/bookings/BookingCard';
import CustomTabBar from '@/components/navigation/CustomTabBar';

const MOCK_UPCOMING = [
  {
    id: 'up-1',
    from: 'Connaught Place, New Delhi',
    to: 'Indira Gandhi International Airport (T3)',
    date: 'Today, 03:30 PM',
    price: '₹ 549',
    status: 'Confirmed',
    tier: 'Delux',
    driver: 'Rajesh Kumar',
    driverRating: '4.9',
    vehicleNo: 'DL 1ZC 4280',
    icon: 'car-sports' as const
  }
];

const MOCK_HISTORY = [
  {
    id: 'hist-1',
    from: 'Select Citywalk, Saket',
    to: 'DLF Cyber City, Gurugram',
    date: '22 Jun 2026, 06:15 PM',
    price: '₹ 899',
    status: 'Completed',
    tier: 'VIP',
    driver: 'Vikram Singh',
    driverRating: '5.0',
    vehicleNo: 'HR 26DK 9001',
    icon: 'crown' as const
  },
  {
    id: 'hist-2',
    from: 'Noida Sector 62',
    to: 'Akshardham Temple, Delhi',
    date: '20 Jun 2026, 11:20 AM',
    price: '₹ 280',
    status: 'Completed',
    tier: 'Standard',
    driver: 'Amit Sharma',
    driverRating: '4.8',
    vehicleNo: 'UP 16AT 5521',
    icon: 'car-side' as const
  },
  {
    id: 'hist-3',
    from: 'Rajouri Garden Metro',
    to: 'Janakpuri District Centre',
    date: '18 Jun 2026, 09:10 AM',
    price: '₹ 120',
    status: 'Cancelled',
    tier: 'Standard',
    driver: 'Unknown',
    driverRating: '0.0',
    vehicleNo: 'N/A',
    icon: 'car-side' as const,
    reason: 'Driver took too long to arrive'
  }
];

export default function BookingsScreen() {
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const handleTabChange = (tab: 'upcoming' | 'history') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveTab(tab);
  };

  const ridesData = activeTab === 'upcoming' ? MOCK_UPCOMING : MOCK_HISTORY;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Rides</Text>
          <Text style={[styles.headerSub, { color: colors.textSub }]}>Track your upcoming and past bookings</Text>
        </View>

        {/* Tab Filters */}
        <View style={[styles.tabsContainer, { borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabFilter,
              activeTab === 'upcoming' && [styles.tabFilterActive, { borderBottomColor: colors.accent }]
            ]}
            onPress={() => handleTabChange('upcoming')}
          >
            <Text style={[
              styles.tabFilterText,
              { color: activeTab === 'upcoming' ? colors.text : colors.textSub }
            ]}>
              Upcoming ({MOCK_UPCOMING.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabFilter,
              activeTab === 'history' && [styles.tabFilterActive, { borderBottomColor: colors.accent }]
            ]}
            onPress={() => handleTabChange('history')}
          >
            <Text style={[
              styles.tabFilterText,
              { color: activeTab === 'history' ? colors.text : colors.textSub }
            ]}>
              History ({MOCK_HISTORY.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rides List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {ridesData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>No rides found</Text>
            </View>
          ) : (
            ridesData.map((ride) => (
              <BookingCard key={ride.id} ride={ride} />
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Custom Bottom Tab Bar Overlay — aligned with Home and Profile */}
      <CustomTabBar activeTab="bookings" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    marginHorizontal: 20,
    marginTop: 8,
  },
  tabFilter: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabFilterActive: {
    borderBottomWidth: 2,
  },
  tabFilterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },


});
