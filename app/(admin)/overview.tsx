import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { format, formatDistanceToNow, startOfDay, subDays } from 'date-fns';

import { CategoryIcon } from '@/components/CategoryIcon';
import { MapViewWrapper, type MapPin } from '@/components/MapView';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useActiveStats, useDisputes, useRatingDistribution, useVerificationQueue } from '@/hooks/use-admin';
import { useAllRequests } from '@/hooks/use-requests';
import { useAllWorkers } from '@/hooks/use-workers';
import { colors } from '@/constants/theme';
import { STATUS_LABEL, type RequestStatus } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';

const ACTIVE_STATUSES: RequestStatus[] = [
  'searching',
  'pending_worker_response',
  'accepted',
  'on_the_way',
  'arrived',
  'in_progress',
];

const STATUS_SEGMENT_COLOR: Record<RequestStatus, string> = {
  searching: '#A8A29E',
  pending_worker_response: '#F59E0B',
  accepted: '#7A1B1C',
  on_the_way: '#B45309',
  arrived: '#D97706',
  in_progress: '#57534E',
  rejected: '#DC2626',
  completed: '#16A34A',
  cancelled: '#78716C',
};

function StatTile({ label, value, tone }: { label: string; value: number | string; tone?: 'primary' | 'accent' }) {
  return (
    <View
      className={`flex-1 rounded-lg p-4 border ${
        tone === 'accent' ? 'border-accent bg-secondary' : 'border-border bg-background'
      }`}
    >
      <Text className="text-muted-fg text-xs uppercase tracking-wide">{label}</Text>
      <Text className={`font-mono text-3xl mt-1 ${tone === 'accent' ? 'text-accent' : 'text-primary'}`}>{value}</Text>
    </View>
  );
}

export default function AdminOverview() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading, refetch, isRefetching } = useActiveStats();
  const { data: distribution } = useRatingDistribution();
  const { data: queue } = useVerificationQueue('pending');
  const { data: openDisputes } = useDisputes('open');
  const { data: allRequests, isLoading: requestsLoading } = useAllRequests();
  const { data: workers, isLoading: workersLoading } = useAllWorkers();

  const requests = useMemo(() => allRequests ?? [], [allRequests]);
  const maxCount = Math.max(1, ...(distribution ?? []).map((d) => d.count));

  const nameParts = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : (nameParts[0] ?? 'A').slice(0, 2).toUpperCase();

  const onlineWorkers = (workers ?? []).filter((w) => w.isOnline);
  const activeRequests = requests.filter((r) => ACTIVE_STATUSES.includes(r.status));

  const mapPins: MapPin[] = [
    ...onlineWorkers.map((w) => ({
      id: `worker-${w.userId}`,
      coordinate: w.g.geopoint,
      label: w.name,
      tint: '#F59E0B',
      onPress: () => router.push('/(admin)/users'),
    })),
    ...activeRequests.map((r) => ({
      id: `request-${r.id}`,
      coordinate: r.customerLocation,
      label: r.title,
      tint: colors.primary,
      onPress: () => router.push(`/(admin)/request/${r.id}`),
    })),
  ];

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const request of requests) {
      counts.set(request.category, (counts.get(request.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  const maxCategory = Math.max(1, ...categoryCounts.map((row) => row.count));

  const dayBuckets = useMemo(() => {
    const today = startOfDay(new Date());
    const buckets = Array.from({ length: 7 }, (_, index) => ({ day: subDays(today, 6 - index), count: 0 }));
    const byDay = new Map(buckets.map((bucket) => [bucket.day.getTime(), bucket]));
    for (const request of requests) {
      const bucket = byDay.get(startOfDay(new Date(request.createdAt)).getTime());
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }, [requests]);

  const maxDay = Math.max(1, ...dayBuckets.map((bucket) => bucket.count));

  const statusCounts = useMemo(() => {
    const counts = new Map<RequestStatus, number>();
    for (const request of requests) {
      counts.set(request.status, (counts.get(request.status) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  const recent = useMemo(
    () =>
      [...requests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    [requests],
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View className="px-5 pt-14 pb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="font-display text-2xl text-primary">Operations</Text>
          <Text className="text-muted-fg text-xs mt-1">Live view of Madurai service demand.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => router.push('/(admin)/profile')}
          className="w-11 h-11 rounded-full bg-primary items-center justify-center"
        >
          <Text className="text-white font-sans text-sm">{initials}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="px-5">
          <SkeletonCard lines={3} />
        </View>
      ) : (
        <>
          <View className="px-5 flex-row mb-3">
            <StatTile label="Active jobs" value={stats?.total ?? 0} tone="primary" />
            <View className="w-3" />
            <StatTile label="Searching" value={stats?.searching ?? 0} tone="accent" />
          </View>

          <View className="px-5 flex-row mb-6">
            <StatTile label="Awaiting worker" value={stats?.pending ?? 0} />
            <View className="w-3" />
            <StatTile label="Accepted" value={stats?.accepted ?? 0} />
          </View>
        </>
      )}

      <View className="px-5 mb-6">
        <Text className="font-display text-lg text-primary mb-3">Needs attention</Text>
        <View className="flex-row mb-3">
          <View
            className="flex-1 border border-border rounded-lg p-4 mr-2"
            accessibilityRole="button"
            onTouchEnd={() => router.push('/(admin)/verification')}
          >
            <Text className="font-mono text-2xl text-primary">{queue?.length ?? 0}</Text>
            <Text className="text-muted-fg text-xs mt-1">IDs awaiting review</Text>
            {queue?.length ? <Badge label="Action needed" tone="warning" /> : null}
          </View>

          <View
            className="flex-1 border border-border rounded-lg p-4"
            accessibilityRole="button"
            onTouchEnd={() => router.push('/(admin)/disputes')}
          >
            <Text className="font-mono text-2xl text-primary">{openDisputes?.length ?? 0}</Text>
            <Text className="text-muted-fg text-xs mt-1">Open disputes</Text>
            {openDisputes?.length ? <Badge label="Action needed" tone="destructive" /> : null}
          </View>
        </View>
      </View>

      {workersLoading || requestsLoading ? (
        <View className="px-5 mb-6">
          <SkeletonCard lines={3} />
        </View>
      ) : mapPins.length > 0 ? (
        <View className="px-5 mb-6">
          <Text className="font-display text-lg text-primary mb-3">Live map</Text>
          <MapViewWrapper pins={mapPins} height={200} />
        </View>
      ) : null}

      {requestsLoading ? (
        <View className="px-5 mb-6">
          <SkeletonCard lines={4} />
        </View>
      ) : categoryCounts.length > 0 ? (
        <View className="px-5 mb-6">
          <Text className="font-display text-lg text-primary mb-3">Jobs by category</Text>
          <View className="border border-border rounded-lg p-4">
            {categoryCounts.map((row) => (
              <View key={row.category} className="flex-row items-center mb-2">
                <View className="flex-row items-center w-28 pr-2">
                  <CategoryIcon category={row.category} size={14} />
                  <Text className="text-foreground text-xs ml-1 flex-1" numberOfLines={1}>
                    {row.category}
                  </Text>
                </View>
                <View className="flex-1 h-2 rounded-full bg-secondary overflow-hidden mr-2">
                  <View
                    className="h-full bg-primary"
                    style={{ width: `${Math.round((row.count / maxCategory) * 100)}%` }}
                  />
                </View>
                <Text className="font-mono text-xs text-muted-fg w-6 text-right">{row.count}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {requestsLoading ? (
        <View className="px-5 mb-6">
          <SkeletonCard lines={4} />
        </View>
      ) : requests.length > 0 ? (
        <View className="px-5 mb-6">
          <Text className="font-display text-lg text-primary mb-3">Requests over time</Text>
          <View className="border border-border rounded-lg p-4">
            <View className="flex-row items-end justify-between h-24">
              {dayBuckets.map((bucket) => (
                <View key={bucket.day.getTime()} className="flex-1 items-center">
                  <Text className="text-[10px] text-muted-fg mb-1">{bucket.count}</Text>
                  <View
                    className="w-6 bg-primary rounded-sm"
                    style={{ height: Math.max(4, Math.round((bucket.count / maxDay) * 72)) }}
                  />
                </View>
              ))}
            </View>
            <View className="flex-row justify-between mt-2">
              {dayBuckets.map((bucket) => (
                <Text key={bucket.day.getTime()} className="flex-1 text-center text-[10px] text-muted-fg">
                  {format(bucket.day, 'EEE')}
                </Text>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {requestsLoading ? (
        <View className="px-5 mb-6">
          <SkeletonCard lines={4} />
        </View>
      ) : statusCounts.length > 0 ? (
        <View className="px-5 mb-6">
          <Text className="font-display text-lg text-primary mb-3">Status distribution</Text>
          <View className="border border-border rounded-lg p-4">
            <View className="h-3 flex-row rounded-full overflow-hidden bg-secondary">
              {statusCounts.map((row) => (
                <View
                  key={row.status}
                  style={{ flex: row.count, backgroundColor: STATUS_SEGMENT_COLOR[row.status] }}
                />
              ))}
            </View>
            {statusCounts.map((row) => (
              <View key={row.status} className="flex-row items-center mt-2">
                <View
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: STATUS_SEGMENT_COLOR[row.status] }}
                />
                <Text className="text-foreground text-xs flex-1">{STATUS_LABEL[row.status]}</Text>
                <Text className="font-mono text-xs text-muted-fg">{row.count}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="px-5 mb-6">
        <Text className="font-display text-lg text-primary mb-3">Rating distribution</Text>
        <View className="border border-border rounded-lg p-4">
          {(distribution ?? []).length === 0 ? (
            <Text className="text-muted-fg text-sm">No ratings recorded yet.</Text>
          ) : (
            (distribution ?? [])
              .slice()
              .sort((a, b) => b.stars - a.stars)
              .map((row) => (
                <View key={row.stars} className="flex-row items-center mb-2">
                  <Text className="w-10 font-mono text-xs text-muted-fg">{row.stars}★</Text>
                  <View className="flex-1 h-3 rounded-full bg-secondary overflow-hidden mr-3">
                    <View
                      className="h-full bg-primary"
                      style={{ width: `${Math.round((row.count / maxCount) * 100)}%` }}
                    />
                  </View>
                  <Text className="font-mono text-xs text-foreground w-8 text-right">{row.count}</Text>
                </View>
              ))
          )}
        </View>
      </View>

      <View className="px-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-display text-lg text-primary">Recent activity</Text>
          <Text onPress={() => router.push('/(admin)/requests')} className="text-primary text-xs underline">
            View all
          </Text>
        </View>

        {requestsLoading ? (
          <SkeletonCard />
        ) : recent.length === 0 ? (
          <Text className="text-muted-fg text-sm">No requests have come in yet.</Text>
        ) : (
          recent.map((request) => (
            <Pressable
              key={request.id}
              accessibilityRole="button"
              onPress={() => router.push(`/(admin)/request/${request.id}`)}
              className="border border-border rounded-lg p-4 mb-2"
            >
              <View className="flex-row items-start">
                <View className="mr-2 mt-0.5">
                  <CategoryIcon category={request.category} size={16} />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="text-foreground font-sans" numberOfLines={1}>
                    {request.title}
                  </Text>
                  <Text className="text-muted-fg text-xs mt-1">
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </Text>
                </View>
                <StatusBadge status={request.status} />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}
