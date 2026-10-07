import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip } from '@/components/ui/Chip';
import { PaymentBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAllRequests } from '@/hooks/use-requests';
import { colors } from '@/constants/theme';
import type { RequestStatus } from '@/lib/types';

const FILTERS: (RequestStatus | 'all')[] = [
  'all',
  'searching',
  'pending_worker_response',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
];

const LABEL: Record<string, string> = {
  all: 'All',
  searching: 'Searching',
  pending_worker_response: 'Awaiting worker',
  accepted: 'Accepted',
  on_the_way: 'On the way',
  arrived: 'Arrived',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function AdminRequests() {
  const router = useRouter();
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const { data, isLoading, refetch, isRefetching } = useAllRequests(
    filter === 'all' ? undefined : filter,
  );

  const requests = useMemo(() => data ?? [], [data]);

  const revenue = useMemo(
    () =>
      requests
        .filter((r) => r.paymentStatus === 'paid')
        .reduce((sum, r) => sum + (r.bill?.total ?? 0), 0),
    [requests],
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View className="px-5 pt-14 pb-3">
        <Text className="font-display text-2xl text-primary">Requests</Text>
        <Text className="text-muted-fg text-xs mt-1">
          {requests.length} shown · ₹{revenue} collected
        </Text>
      </View>

      <View className="flex-row px-5 mb-4 flex-wrap">
        {FILTERS.map((option) => (
          <Chip key={option} label={LABEL[option]} selected={filter === option} onPress={() => setFilter(option)} />
        ))}
      </View>

      <View className="px-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : requests.length === 0 ? (
          <EmptyState title="No requests" body="Nothing matches this status filter." />
        ) : (
          requests.map((request) => (
            <View key={request.id} className="border border-border rounded-lg p-4 mb-3">
              <View className="flex-row items-start justify-between">
                <Text className="text-foreground font-sans flex-1 pr-2">{request.title}</Text>
                <StatusBadge status={request.status} />
              </View>

              <Text className="text-muted-fg text-xs mt-1">
                {request.category} · {request.customerName} → {request.workerName ?? 'unassigned'}
              </Text>

              <Text className="text-muted-fg text-xs mt-1">
                {request.customerArea ? `${request.customerArea} · ` : ''}
                {new Date(request.createdAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>

              <View className="flex-row items-center justify-between mt-3">
                <Text className="font-mono text-sm text-primary">
                  {request.bill ? `₹${request.bill.total}` : '—'}
                </Text>
                <PaymentBadge status={request.paymentStatus ?? 'unpaid'} />
              </View>

              <Button
                label="Open details"
                size="sm"
                variant="outline"
                className="mt-3"
                onPress={() => router.push(`/request/${request.id}`)}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}