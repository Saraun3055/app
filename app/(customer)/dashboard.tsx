import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Radio } from 'lucide-react-native';

import { PaymentBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CategoryGrid } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useMyRequests } from '@/hooks/use-requests';
import { useAuthStore } from '@/stores/auth';
import type { ServiceCategory, ServiceRequestDoc } from '@/lib/types';

const ACTIVE_STATUSES: ServiceRequestDoc['status'][] = [
  'searching',
  'pending_worker_response',
  'accepted',
  'on_the_way',
  'arrived',
  'in_progress',
];

/** 10% → 100% across the seven live-status steps. */
const PROGRESS_BY_STATUS: Record<string, number> = {
  searching: 10,
  pending_worker_response: 25,
  accepted: 40,
  on_the_way: 55,
  arrived: 70,
  in_progress: 85,
  completed: 100,
};

function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch, isRefetching } = useMyRequests(user?.uid);

  const requests = useMemo(() => data ?? [], [data]);
  const active = useMemo(() => requests.find((r) => ACTIVE_STATUSES.includes(r.status)), [requests]);
  const recent = useMemo(
    () => requests.filter((r) => r.id !== active?.id).slice(0, 4),
    [requests, active],
  );

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7A1B1C" />}
    >
      <View className="px-5 pt-14 pb-4">
        <Text className="font-display text-2xl text-primary">What&apos;s broken, {firstName}?</Text>
      </View>

      {active ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/requests/${active.id}`)}
          className="bg-primary rounded-lg p-4 mb-6 mx-5"
        >
          <View className="flex-row items-center mb-1">
            <Radio size={14} color="#FDF2F2" />
            <Text className="text-secondary text-xs ml-2 uppercase tracking-wide">Active request</Text>
          </View>
          <Text className="text-white font-display text-lg">{active.title}</Text>
          <View className="mt-2 self-start">
            <StatusBadge status={active.status} />
          </View>
          <View className="mt-4 bg-secondary rounded-full h-1.5 overflow-hidden">
            <View
              className="h-full bg-accent"
              style={{ width: `${PROGRESS_BY_STATUS[active.status] ?? 10}%` }}
            />
          </View>
          <Text className="text-secondary text-sm mt-3">Track live →</Text>
        </Pressable>
      ) : null}

      <View className="px-5 mb-6">
        <Text className="font-display text-lg text-primary mb-3">Book a service</Text>
        <CategoryGrid onSelect={(category: ServiceCategory) => router.push({ pathname: '/new', params: { category } })} />
      </View>

      <View className="px-5 mb-8">
        <Text className="font-display text-lg text-primary mb-3">Recent requests</Text>

        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : recent.length === 0 ? (
          <EmptyState
            title="No requests yet"
            body="Pick a category above and we will find verified workers near you."
            action={<Button label="Create a request" onPress={() => router.push('/new')} />}
          />
        ) : (
          recent.map((request) => (
            <Pressable
              key={request.id}
              accessibilityRole="button"
              onPress={() => router.push(`/requests/${request.id}`)}
              className="border border-border rounded-lg p-4 bg-background mb-3"
            >
              <View className="flex-row items-start justify-between">
                <Text className="text-foreground font-sans flex-1 pr-2">{request.title}</Text>
                <StatusBadge status={request.status} />
              </View>
              <View className="flex-row items-center mt-2">
                <Text className="text-muted-fg text-xs">{request.category}</Text>
                <Text className="text-muted-fg text-xs mx-2">·</Text>
                <Text className="text-muted-fg text-xs">{relativeTime(request.createdAt)}</Text>
              </View>

              <View className="flex-row items-center mt-3 gap-2">
                {request.status === 'completed' && request.paymentStatus !== 'paid' ? (
                  <Button label="Pay bill" size="sm" onPress={() => router.push(`/requests/${request.id}`)} />
                ) : null}
                {request.status === 'completed' && !request.ratingGiven ? (
                  <Button
                    label="Rate worker"
                    size="sm"
                    variant="outline"
                    onPress={() => router.push(`/rate/${request.id}`)}
                  />
                ) : null}
                {request.status === 'completed' && request.paymentStatus === 'paid' ? (
                  <PaymentBadge status={request.paymentStatus} />
                ) : null}
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View className="mx-5 rounded-lg bg-primary px-4 py-4">
        <View className="flex-row items-center mb-1">
          <MapPin size={14} color="#FDF2F2" />
          <Text className="text-secondary text-xs ml-2 uppercase tracking-wide">Location</Text>
        </View>
        <Text className="text-white font-sans">We always use your real location</Text>
        <Text className="text-secondary text-xs mt-1">
          Workers are matched on distance, so only people who can actually reach you see your request.
        </Text>
      </View>
    </ScrollView>
  );
}