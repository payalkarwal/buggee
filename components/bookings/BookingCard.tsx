import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from '@/context/ThemeContext';

export interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  price: string;
  status: string; // 'Completed' | 'Confirmed' | 'Cancelled'
  tier: string;
  driver: string;
  driverRating: string;
  vehicleNo: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  reason?: string;
}

interface BookingCardProps {
  ride: Ride;
}

export default function BookingCard({ ride }: BookingCardProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.rideCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.rideTypeRow}>
          <MaterialCommunityIcons name={ride.icon} size={24} color={colors.accent} />
          <Text style={[styles.rideTier, { color: colors.text }]}>{ride.tier}</Text>
        </View>
        <Text style={[styles.ridePrice, { color: colors.accent }]}>{ride.price}</Text>
      </View>

      {/* Route Connector Visual */}
      <View style={styles.routeContainer}>
        <View style={styles.pinsCol}>
          <Ionicons name="disc" size={16} color={colors.accent} />
          <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
          <Ionicons name="location" size={16} color={colors.danger} />
        </View>
        
        <View style={styles.addressesCol}>
          <View style={styles.addrBlock}>
            <Text style={[styles.addrLabel, { color: colors.textSub }]}>PICKUP</Text>
            <Text style={[styles.addrText, { color: colors.text }]} numberOfLines={1}>
              {ride.from}
            </Text>
          </View>
          
          <View style={styles.addrBlock}>
            <Text style={[styles.addrLabel, { color: colors.textSub }]}>DROP-OFF</Text>
            <Text style={[styles.addrText, { color: colors.text }]} numberOfLines={1}>
              {ride.to}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

      {/* Ride Footer / Status */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={[styles.rideDate, { color: colors.textSub }]}>{ride.date}</Text>
          {ride.driver !== 'Unknown' && (
            <Text style={[styles.driverName, { color: colors.text }]}>
              {ride.driver} • ★{ride.driverRating}
            </Text>
          )}
        </View>
        
        <View style={[
          styles.statusBadge,
          ride.status === 'Completed' && { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: colors.success },
          ride.status === 'Confirmed' && { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3B82F6' },
          ride.status === 'Cancelled' && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: colors.danger }
        ]}>
          <Text style={[
            styles.statusText,
            ride.status === 'Completed' && { color: colors.success },
            ride.status === 'Confirmed' && { color: '#3B82F6' },
            ride.status === 'Cancelled' && { color: colors.danger }
          ]}>
            {ride.status}
          </Text>
        </View>
      </View>
      
      {ride.status === 'Cancelled' && ride.reason && (
        <View style={[styles.cancelReasonBox, { backgroundColor: colors.dangerDim }]}>
          <Text style={[styles.cancelReasonText, { color: colors.danger }]}>
            Reason: {ride.reason}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rideCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rideTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideTier: {
    fontSize: 16,
    fontWeight: '800',
  },
  ridePrice: {
    fontSize: 17,
    fontWeight: '800', // standard styling limit
  },
  routeContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  pinsCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    borderRadius: 1,
  },
  addressesCol: {
    flex: 1,
    gap: 12,
  },
  addrBlock: {
    gap: 2,
  },
  addrLabel: {
    fontSize: 9,
    fontWeight: '750',
    letterSpacing: 0.5,
  },
  addrText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  driverName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cancelReasonBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  cancelReasonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
