import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Badge, PaymentBadge, StatusBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useActiveStats, useDisputes, useRatingDistribution, useVerificationQueue } from '@/hooks/use-admin';
import { useAllRequests } from '@/hooks/use-requests';
import { colors } from '@/constants/theme';

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

  const { data: stats, isLoading, refetch, isRefetching } = useActiveStats();
  const { data: distribution } = useRatingDistribution();
  const { data: queue } = useVerificationQueue('pending');
  const { data: openDisputes } = useDisputes('open');
  const { data: recent } = useAllRequests();

  const maxCount = Math.max(1, ...(distribution ?? []).map((d) => d.count));

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View className="px-5 pt-14 pb-3">
        <Text className="font-display text-2xl text-primary">Operations</Text>
        <Text className="text-muted-fg text-xs mt-1">Live view of Madurai service demand.</Text>
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
          <Text className="font-display text-lg text-primary">Latest requests</Text>
          <Text onPress={() => router.push('/(admin)/requests')} className="text-primary text-xs underline">
            View all
          </Text>
        </View>

        {(recent ?? []).slice(0, 6).map((request) => (
          <View key={request.id} className="border border-border rounded-lg p-4 mb-2">
            <View className="flex-row items-start justify-between">
              <Text className="text-foreground font-sans flex-1 pr-2">{request.title}</Text>
              <StatusBadge status={request.status} />
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-muted-fg text-xs">
                {request.category} · {request.customerName}
              </Text>
              <PaymentBadge status={request.paymentStatus ?? 'unpaid'} />
            </View>
          </View>
        ))}

        {!recent?.length && !isLoading ? (
          <Text className="text-muted-fg text-sm">No requests have come in yet.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}