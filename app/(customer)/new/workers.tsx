import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { MapViewWrapper } from '@/components/MapView';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { WorkerCard } from '@/components/WorkerCard';
import { useAssignWorker } from '@/hooks/use-requests';
import { useNearbyWorkers } from '@/hooks/use-workers';
import { haversine } from '@/lib/geo';
import { useGeo } from '@/hooks/use-geo';
import { colors } from '@/constants/theme';
import type { WorkerProfileDoc } from '@/lib/types';

const SORTS = ['Rating', 'Nearby', 'Fastest'] as const;
type SortKey = (typeof SORTS)[number];

const RADIUS_KM = 15;

export default function WorkerSelection() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { coords } = useGeo();
  const assign = useAssignWorker();

  const origin = useMemo(() => coords ?? { latitude: 9.9252, longitude: 78.1198 }, [coords]);
  const [sort, setSort] = useState<SortKey>('Rating');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useNearbyWorkers({
    lat: origin.latitude,
    lng: origin.longitude,
    radiusKm: RADIUS_KM,
    excludeIds: [],
  });

  const workers = useMemo(() => {
    const list: WorkerProfileDoc[] = (data ?? []).map((w) => ({
      ...w,
      _distance: w._distance ?? (w.g?.geopoint ? haversine(origin, w.g.geopoint) : undefined),
    }));

    return list.sort((a, b) => {
      if (sort === 'Nearby') return (a._distance ?? Number.MAX_SAFE_INTEGER) - (b._distance ?? Number.MAX_SAFE_INTEGER);
      if (sort === 'Fastest') return (a.avgResponseMin ?? 999) - (b.avgResponseMin ?? 999);
      return b.rating - a.rating;
    });
  }, [data, origin, sort]);

  const pins = useMemo(
    () =>
      workers.map((w) => ({
        id: w.userId,
        coordinate: w.g?.geopoint ?? origin,
        label: w.name,
        tint: w.isOnline ? colors.accent : colors.mutedFg,
        onPress: () => setSelectedId(w.userId),
      })),
    [workers, origin],
  );

  const sendRequest = async (worker: WorkerProfileDoc) => {
    if (!requestId) {
      Alert.alert('No request selected', 'Start from a new request so we know what the worker is coming for.');
      return;
    }
    try {
      const ok = await assign.mutateAsync({
        requestId,
        workerId: worker.userId,
        workerName: worker.name,
      });
      if (ok) router.replace(`/requests/${requestId}`);
      else Alert.alert('Could not send request', 'That worker may no longer be available.');
    } catch (e: any) {
      Alert.alert('Could not send request', e?.message ?? 'Please try again in a moment.');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-14 pb-3">
        <Text className="font-display text-2xl text-primary">Choose a worker</Text>
        <Text className="text-muted-fg text-xs mt-1">
          {workers.length} verified {workers.length === 1 ? 'worker' : 'workers'} within {RADIUS_KM} km
        </Text>
      </View>

      <View className="px-5">
        <MapViewWrapper pins={pins} fallback={origin} height={200} />
      </View>

      <View className="flex-row px-5 mt-4 mb-3">
        {SORTS.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: sort === option }}
            onPress={() => setSort(option)}
            className={`mr-2 px-3 py-1.5 rounded-full border ${
              sort === option ? 'border-primary bg-primary' : 'border-border'
            }`}
          >
            <Text className={`text-xs font-sans ${sort === option ? 'text-white' : 'text-muted-fg'}`}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        className="flex-1"
        data={workers}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <WorkerCard worker={item} selected={selectedId === item.userId} onRequest={sendRequest} requestLabel="Request →" />
        )}
        ListEmptyComponent={
          isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <EmptyState
              title="No workers available"
              body="Nobody verified is online in your area right now. Try again in a little while."
            />
          )
        }
      />
    </View>
  );
}