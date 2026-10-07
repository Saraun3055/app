import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Crosshair } from 'lucide-react-native';

import { colors } from '@/constants/theme';
import type { GeoPointLike } from '@/lib/types';

export type MapPin = {
  id: string;
  coordinate: GeoPointLike;
  label?: string;
  tint?: string;
  onPress?: () => void;
};

type Props = {
  pins: MapPin[];
  /** Falls back to central Madurai when the customer location is unknown. */
  fallback?: GeoPointLike;
  height?: number;
  showsUserLocation?: boolean;
};

const FALLBACK: GeoPointLike = { latitude: 9.9252, longitude: 78.1198 };

/** Lightweight `react-native-maps` wrapper with tinted pins. */
export function MapViewWrapper({ pins, fallback = FALLBACK, height = 220, showsUserLocation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const initialRegion = useMemo<Region>(() => {
    const anchor = fallback ?? FALLBACK;
    return {
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      latitudeDelta: 0.09,
      longitudeDelta: 0.09,
    };
  }, [fallback]);

  const fitAll = () => {
    if (pins.length === 0) {
      mapRef.current?.animateToRegion(initialRegion);
      return;
    }
    const lats = pins.map((p) => p.coordinate.latitude);
    const lngs = pins.map((p) => p.coordinate.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    mapRef.current?.animateToRegion(
      {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.6),
        longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.6),
      },
      400,
    );
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={setRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={pin.coordinate}
            title={pin.label}
            onPress={pin.onPress}
            pinColor={pin.tint ?? colors.primary}
          />
        ))}
      </MapView>

      {pins.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fit all pins"
          onPress={fitAll}
          style={styles.recenter}
        >
          <Crosshair size={16} color={colors.primary} />
        </Pressable>
      ) : null}

      {region ? null : null}
      <View pointerEvents="none" style={styles.legend}>
        <Text style={styles.legendText}>{pins.length} on the map</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(122,27,28,0.12)',
    backgroundColor: '#FAF4F4',
  },
  recenter: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(122,27,28,0.12)',
  },
  legend: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  legendText: {
    color: colors.mutedFg,
    fontSize: 11,
  },
});