/**
 * LocationSearchDrawer - Full screen location search
 * Fixed: Text visibility and selected location display
 */
import { NEARBY_PLACES } from '@/constants/mockData';
import { useAppTheme } from '@/context/ThemeContext';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useRideStore } from '@/store/rideStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LocationSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlace?: (place: any) => void;
  onSwitchToDrop?: () => void;
}

export default function LocationSearchDrawer({
  isOpen,
  onClose,
  onSelectPlace,
}: LocationSearchDrawerProps) {
  const { colors } = useAppTheme();
  const pickupInputRef = useRef<TextInput>(null);
  const dropInputRef = useRef<TextInput>(null);

  // Local input values - separate from search query for better UX
  const [pickupInput, setPickupInput] = useState('');
  const [dropInput, setDropInput] = useState('');

  const {
    selectedTier,
    locationSelectionType,
    setLocationSelectionType,
    getTierLocation,
    setTierLocation,
    setPickupCoords,
    setDropCoords,
    searchResults,
    isSearching,
  } = useRideStore();
  const { locationSearchQuery, search, clearSearch } = useLocationSearch();

  // Get saved locations from store
  const currentPickup = selectedTier ? getTierLocation(selectedTier, 'pickup') : '';
  const currentDrop = selectedTier ? getTierLocation(selectedTier, 'drop') : '';
  const displayPlaces = locationSearchQuery.trim().length >= 2 ? searchResults : NEARBY_PLACES;

  // Sync local input with saved location when drawer opens or selection type changes
  useEffect(() => {
    if (isOpen) {
      // Initialize inputs with current saved locations
      setPickupInput(currentPickup);
      setDropInput(currentDrop);
      clearSearch();

      // Auto-focus the correct input
      setTimeout(() => {
        if (locationSelectionType === 'pickup') {
          pickupInputRef.current?.focus();
        } else {
          dropInputRef.current?.focus();
        }
      }, 150);
    }
  }, [isOpen]);

  // When selection type changes (e.g., after selecting pickup, switching to drop)
  useEffect(() => {
    if (isOpen) {
      clearSearch();
      setTimeout(() => {
        if (locationSelectionType === 'pickup') {
          pickupInputRef.current?.focus();
        } else {
          dropInputRef.current?.focus();
        }
      }, 100);
    }
  }, [locationSelectionType]);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearSearch();
    onClose();
  };

  const handleInputChange = (text: string, field: 'pickup' | 'drop') => {
    if (field === 'pickup') {
      setPickupInput(text);
    } else {
      setDropInput(text);
    }
    // Trigger search
    search(text);
  };

  const handleFieldFocus = (field: 'pickup' | 'drop') => {
    if (locationSelectionType !== field) {
      setLocationSelectionType(field);
      clearSearch();
    }
  };

  const handleSelect = (place: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectedTier) {
      // Update the tier location name in store
      setTierLocation(selectedTier, locationSelectionType, place.name);

      // Update local input
      if (locationSelectionType === 'pickup') {
        setPickupInput(place.name);
      } else {
        setDropInput(place.name);
      }

      // Update the coordinates if available
      if (place.lat && place.lon) {
        const coords = {
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
        };

        if (locationSelectionType === 'pickup') {
          setPickupCoords(coords);
        } else {
          setDropCoords(coords);
        }
      }
    }

    // Optional callback
    if (onSelectPlace) {
      onSelectPlace(place);
    }

    // Clear search query
    clearSearch();

    // Auto flow: After selecting pickup, switch to drop
    if (locationSelectionType === 'pickup') {
      setLocationSelectionType('drop');
    } else {
      // Drop location selected - close the drawer
      onClose();
    }
  };

  const handleClearLocation = (field: 'pickup' | 'drop') => {
    if (selectedTier) {
      setTierLocation(selectedTier, field, '');
      if (field === 'pickup') {
        setPickupInput('');
        setPickupCoords(null);
      } else {
        setDropInput('');
        setDropCoords(null);
      }
    }
    clearSearch();
  };

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={handleDone}>
      <View style={[styles.container, { backgroundColor: colors.modalBg }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: colors.modalBg }}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={handleDone}
              style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Select Locations</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        {/* Location Inputs */}
        <View style={styles.inputsContainer}>
          {/* Pickup Input */}
          <View
            style={[
              styles.inputRow,
              locationSelectionType === 'pickup' && styles.inputRowActive,
              {
                borderColor: locationSelectionType === 'pickup' ? colors.accent : colors.border,
                backgroundColor: locationSelectionType === 'pickup' ? colors.surface : 'transparent',
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSub }]}>PICKUP</Text>
              <TextInput
                ref={pickupInputRef}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="Search pickup location"
                placeholderTextColor={colors.textMuted}
                value={locationSelectionType === 'pickup' ? locationSearchQuery : pickupInput}
                onChangeText={(text) => handleInputChange(text, 'pickup')}
                onFocus={() => handleFieldFocus('pickup')}
                returnKeyType="search"
                selectionColor={colors.accent}
                cursorColor={colors.accent}
                autoCorrect={false}
              />
            </View>
            {(pickupInput || currentPickup) && (
              <TouchableOpacity
                onPress={() => handleClearLocation('pickup')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={22} color={colors.textSub} />
              </TouchableOpacity>
            )}
          </View>

          {/* Visual Route Line */}
          <View style={styles.routeLineContainer}>
            <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Drop Input */}
          <View
            style={[
              styles.inputRow,
              locationSelectionType === 'drop' && styles.inputRowActive,
              {
                borderColor: locationSelectionType === 'drop' ? '#E53935' : colors.border,
                backgroundColor: locationSelectionType === 'drop' ? colors.surface : 'transparent',
              },
            ]}
          >
            <View style={[styles.square, { borderColor: '#E53935' }]} />
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSub }]}>DROP OFF</Text>
              <TextInput
                ref={dropInputRef}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="Search destination"
                placeholderTextColor={colors.textMuted}
                value={locationSelectionType === 'drop' ? locationSearchQuery : dropInput}
                onChangeText={(text) => handleInputChange(text, 'drop')}
                onFocus={() => handleFieldFocus('drop')}
                returnKeyType="search"
                selectionColor={colors.accent}
                cursorColor={colors.accent}
                autoCorrect={false}
              />
            </View>
            {(dropInput || currentDrop) && (
              <TouchableOpacity
                onPress={() => handleClearLocation('drop')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={22} color={colors.textSub} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results */}
        <View style={styles.resultsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>
            {locationSearchQuery.length >= 2 ? 'SEARCH RESULTS' : 'NEARBY PLACES'}
          </Text>
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={displayPlaces}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.placeRow, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.placeIcon, { backgroundColor: colors.surface }]}>
                    <Ionicons name="location-outline" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.placeInfo}>
                    <Text style={[styles.placeName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.placeAddress, { color: colors.textSub }]} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={colors.textSub} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Done Button */}
        <SafeAreaView edges={['bottom']} style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.doneButton,
              {
                backgroundColor: currentPickup && currentDrop ? colors.accent : colors.surface,
              },
            ]}
            onPress={handleDone}
          >
            <Text
              style={[
                styles.doneButtonText,
                { color: currentPickup && currentDrop ? '#000' : colors.textSub },
              ]}
            >
              {currentPickup && currentDrop ? 'Confirm Locations' : 'Done'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  inputsContainer: { padding: 16, gap: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    minHeight: 60,
  },
  inputRowActive: { borderWidth: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  square: { width: 12, height: 12, borderWidth: 2, borderRadius: 2 },
  inputWrapper: { flex: 1 },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
    margin: 0,
    minHeight: 24,
    ...Platform.select({
      android: {
        paddingVertical: 0,
      },
    }),
  },
  routeLineContainer: { paddingLeft: 21, height: 8 },
  routeLine: { width: 2, height: '100%' },
  resultsContainer: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  placeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '600' },
  placeAddress: { fontSize: 13, marginTop: 2 },
  footer: { padding: 16, borderTopWidth: 1 },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonText: { fontSize: 16, fontWeight: '700' },
});
