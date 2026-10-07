import React, { useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useReviewVerification, useVerificationQueue } from '@/hooks/use-admin';
import { colors } from '@/constants/theme';
import type { VerificationQueueStatus } from '@/lib/types';

const FILTERS: (VerificationQueueStatus | 'all')[] = ['pending', 'approved', 'rejected', 'all'];
const FILTER_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'All',
};

export default function AdminVerification() {
  const [filter, setFilter] = useState<VerificationQueueStatus | 'all'>('pending');
  const { data, isLoading, refetch, isRefetching } = useVerificationQueue(filter);
  const review = useReviewVerification();

  const queue = data ?? [];

  const decide = async (workerId: string, workerName: string | undefined, status: 'approved' | 'rejected') => {
    const label = status === 'approved' ? 'Approve' : 'Reject';
    Alert.alert(
      `${label} ${workerName ?? 'this worker'}?`,
      status === 'approved'
        ? 'They will immediately start appearing to customers in your review area.'
        : 'They will be asked to re-upload their ID and will not receive jobs until approved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: label,
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: () =>
            review.mutate(
              { workerId, status },
              {
                onSuccess: (ok) => {
                  if (ok) refetch();
                  else Alert.alert('Could not save', 'Please try again.');
                },
                onError: () => Alert.alert('Could not save', 'Please try again.'),
              },
            ),
        },
      ],
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View className="px-5 pt-14 pb-3">
        <Text className="font-display text-2xl text-primary">ID verification</Text>
        <Text className="text-muted-fg text-xs mt-1">
          Every worker must be approved before customers can see them.
        </Text>
      </View>

      <View className="flex-row px-5 mb-4 flex-wrap">
        {FILTERS.map((option) => (
          <Chip key={option} label={FILTER_LABEL[option]} selected={filter === option} onPress={() => setFilter(option)} />
        ))}
      </View>

      <View className="px-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : queue.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            body={`No ${filter === 'all' ? '' : FILTER_LABEL[filter].toLowerCase() + ' '}submissions to review right now.`}
          />
        ) : (
          queue.map((entry) => (
            <View key={entry.workerId} className="border border-border rounded-lg p-4 mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-foreground font-display text-lg">{entry.workerName ?? 'Worker'}</Text>
                <VerificationBadge status={entry.status} />
              </View>

              <Text className="text-muted-fg text-xs font-mono mb-3">
                {entry.workerId.slice(0, 20)}… · submitted{' '}
                {new Date(entry.submittedAt).toLocaleDateString('en-IN')}
              </Text>

              <Image
                source={{ uri: entry.govIdUrl }}
                style={{ width: '100%', height: 220, borderRadius: 12, backgroundColor: colors.secondary }}
                resizeMode="contain"
              />

              {entry.status === 'pending' ? (
                <View className="flex-row mt-4">
                  <View className="flex-1 mr-2">
                    <Button
                      label="Reject"
                      fullWidth
                      variant="destructive"
                      loading={review.isPending}
                      onPress={() => decide(entry.workerId, entry.workerName, 'rejected')}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Approve"
                      fullWidth
                      loading={review.isPending}
                      onPress={() => decide(entry.workerId, entry.workerName, 'approved')}
                    />
                  </View>
                </View>
              ) : (
                <View className="mt-4 flex-row items-center gap-2">
                  <Badge
                    label={entry.reviewedAt ? `Reviewed ${new Date(entry.reviewedAt).toLocaleDateString('en-IN')}` : 'Reviewed'}
                    tone="neutral"
                  />
                  {entry.reviewedBy ? <Text className="text-muted-fg text-xs">by {entry.reviewedBy}</Text> : null}
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}