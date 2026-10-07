import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { Chip } from '@/components/ui/Chip';
import { PaymentBadge, StatusBadge } from '@/components/ui/Badge';
import { RequestCard } from '@/components/RequestCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Stars } from '@/components/ui/Stars';
import { useWorkerJobs } from '@/hooks/use-requests';
import { useWorkerRatings } from '@/hooks/use-workers';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';

const FILTERS = ['All', 'Active', 'Completed'] as const;
type FilterKey = (typeof FILTERS)[number];

const ACTIVE = ['accepted', 'on_the_way', 'arrived', 'in_progress'];

export default function WorkerJobs() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch, isRefetching } = useWorkerJobs(user?.uid);
  const { data: ratings } = useWorkerRatings(user?.uid);
  const [filter, setFilter] = useState<FilterKey>('All');

  const jobs = useMemo(() => {
    const list = data ?? [];
    if (filter === 'Active') return list.filter((j) => ACTIVE.includes(j.status));
    if (filter === 'Completed') return list.filter((j) => j.status === 'completed' || j.status === 'cancelled');
    return list;
  }, [data, filter]);

  const earnings = useMemo(() => {
    const list = (data ?? []).filter((j) => j.status === 'completed' && j.paymentStatus === 'paid');
    return list.reduce((sum, j) => sum + (j.bill?.laborWage ?? 0), 0);
  }, [data]);

  const paidJobs = useMemo(
    () => (data ?? []).filter((j) => j.status === 'completed' && j.paymentStatus === 'paid').length,
    [data],
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View className="px-5 pt-14 pb-3">
        <Text className="font-display text-2xl text-primary">My jobs</Text>
      </View>

      <View className="mx-5 mb-4 flex-row">
        <View className="flex-1 border border-border rounded-lg p-4">
          <Text className="text-muted-fg text-xs uppercase tracking-wide">Labour earned</Text>
          <Text className="font-mono text-2xl text-primary mt-1">₹{earnings}</Text>
        </View>
        <View className="w-3" />
        <View className="flex-1 border border-border rounded-lg p-4">
          <Text className="text-muted-fg text-xs uppercase tracking-wide">Jobs paid</Text>
          <Text className="font-mono text-2xl text-primary mt-1">{paidJobs}</Text>
        </View>
      </View>

      <View className="flex-row px-5 mb-4">
        {FILTERS.map((option) => (
          <Chip key={option} label={option} selected={filter === option} onPress={() => setFilter(option)} />
        ))}
      </View>

      <View className="px-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : jobs.length === 0 ? (
          <EmptyState
            title={filter === 'All' ? 'No jobs yet' : `No ${filter.toLowerCase()} jobs`}
            body={
              filter === 'All'
                ? 'Accept a job from Incoming and it will appear here with live status tracking.'
                : 'Try another filter to see the rest of your work history.'
            }
          />
        ) : (
          jobs.map((job) => {
            const rating =
              job.status === 'completed'
                ? ratings?.find((r) => r.requestId === job.id)?.rating
                : undefined;
            return (
              <RequestCard
                key={job.id}
                request={job}
                onPress={() => router.push(`/job/${job.id}`)}
                footer={
                  <View>
                    <View className="flex-row items-center justify-between">
                      {job.bill ? (
                        <Text className="font-mono text-sm text-primary">
                          ₹{job.bill.laborWage} labour
                        </Text>
                      ) : (
                        <Text />
                      )}
                      <View className="flex-row items-center gap-2">
                        <StatusBadge status={job.status} />
                        <PaymentBadge status={job.paymentStatus} />
                      </View>
                    </View>
                    {typeof rating === 'number' ? (
                      <View className="flex-row items-center mt-2">
                        <Stars value={rating} size={13} showValue />
                      </View>
                    ) : null}
                  </View>
                }
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}