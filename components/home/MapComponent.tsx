import React, { forwardRef, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

// Lighter dark map style - more visible and professional
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1A1A2E' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8B8B9A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1A1A2E' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2D2D44' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1F1F35' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#252540' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1E2E28' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A2A45' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3A3A55' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2F2F4A' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#252540' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#141428' }] },
];

const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#F5F5F5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F5F5F5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#BDBDBD' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#EAEAEA' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#EEEEEE' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#DADADA' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9C9C9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9E9E9E' }] },
];

interface MapComponentProps {
  region: Region;
  userLocation: { latitude: number; longitude: number } | null;
  isDark: boolean;
}

const MapComponent = forwardRef<MapView, MapComponentProps>(
  ({ region, userLocation, isDark }, ref) => {
    const markerPulseAnim = useRef(new Animated.Value(1)).current;
    const markerRippleAnim = useRef(new Animated.Value(0)).current;
    const markerBounceAnim = useRef(new Animated.Value(0)).current;

    // Marker animations
    useEffect(() => {
      if (userLocation) {
        // Initial bounce animation when marker appears
        Animated.spring(markerBounceAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();

        // Continuous pulse animation
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(markerPulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
            Animated.timing(markerPulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ])
        );
        pulse.start();

        // Continuous ripple animation
        const ripple = Animated.loop(
          Animated.sequence([
            Animated.timing(markerRippleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(markerRippleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        );
        ripple.start();

        return () => {
          pulse.stop();
          ripple.stop();
        };
      }
    }, [userLocation]);

    return (
      <View style={StyleSheet.absoluteFillObject}>
        <MapView
          ref={ref}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          customMapStyle={isDark ? darkMapStyle : lightMapStyle}
          showsUserLocation={false}
          showsCompass={false}
          showsScale={false}
          rotateEnabled
          pitchEnabled
        >
          {/* Precise pickup location pin */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              zIndex={2}
            >
              <Animated.View style={[styles.markerContainer, { transform: [{ scale: markerBounceAnim }] }]} collapsable={false}>
                {/* Outer ripple effect */}
                <Animated.View
                  style={[
                    styles.markerRipple,
                    {
                      transform: [
                        {
                          scale: markerRippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.5],
                          }),
                        },
                      ],
                      opacity: markerRippleAnim.interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [0.4, 0.15, 0],
                      }),
                    },
                  ]}
                />

                {/* Pulsing base circle */}
                <Animated.View
                  style={[
                    styles.markerBase,
                    {
                      transform: [{ scale: markerPulseAnim }],
                    },
                  ]}
                />

                {/* Main pin */}
                <View style={styles.markerPinWrapper}>
                  <View style={styles.markerPinShadow} />
                  <View style={styles.markerPin}>
                    <View style={styles.markerPinInner}>
                      <Ionicons name="location" size={18} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.markerPinPoint} />
                </View>
              </Animated.View>
            </Marker>
          )}
        </MapView>
      </View>
    );
  }
);

MapComponent.displayName = 'MapComponent';

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  markerRipple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF4F8B',
  },
  markerBase: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 79, 139, 0.25)',
  },
  markerPinWrapper: {
    alignItems: 'center',
  },
  markerPinShadow: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF4F8B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  markerPinInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4F8B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  markerPinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF4F8B',
    marginTop: -3,
  },
});

export default MapComponent;
