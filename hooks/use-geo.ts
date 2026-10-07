import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { GeoPointLike } from '@/lib/types';

export type GeoState = {
  coords: GeoPointLike | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Real-time device location. Falls back to central Madurai so the map and
 * distance sorting still work when permission is denied.
 */
export const MADURAI_CENTRE: GeoPointLike = { latitude: 9.9252, longitude: 78.1198 };

export function useGeo(): GeoState {
  const [coords, setCoords] = useState<GeoPointLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCoords(MADURAI_CENTRE);
        setError('Location permission denied — using central Madurai');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (e: any) {
      setCoords(MADURAI_CENTRE);
      setError(e?.message ?? 'Could not read your location');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { coords, loading, error, refresh };
}