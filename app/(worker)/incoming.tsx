import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RequestCard } from '@/components/RequestCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { OnlineToggle } from '@/components/OnlineToggle';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAcceptRequest, useRejectRequest, useWorkerIncoming } from '@/hooks/use-requests';
import { useBackgroundChangeNotification } from '@/hooks/use-notifications';
import { useSetAvailability, useWorkerProfile } from '@/hooks/use-workers';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';
import type { ServiceRequestDoc } from '@/lib/types';

export default function Incoming() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: profile, refetch: refetchProfile } = useWorkerProfile(user?.uid);
  const { data, isLoading, refetch, isRefetching } = useWorkerIncoming(user?.uid);
  const accept = useAcceptRequest();
  const reject = useRejectRequest();
  const availability = useSetAvailability();

  const [busyId, setBusyId] = useState<string | null>(null);

  const requests = data ?? [];

  const countChanged = (a: ServiceRequestDoc[], b: ServiceRequestDoc[]) => a.length === b.length;
  const buildNewRequestNotice = (next: ServiceRequestDoc[]) => {
    const newest = next[0];
    if (!newest) return null;
    return {
      title: 'New job near you',
      body: `${newest.category} · ${newest.customerArea ?? 'your area'}`,
      url: '/incoming',
    };
  };

  useBackgroundChangeNotification<ServiceRequestDoc[]>(requests, countChanged, buildNewRequestNotice);

  const refreshAll = () => {
    void refetch();
    void refetchProfile();
  };

  const onAccept = async (requestId: string) => {
    setBusyId(requestId);
    try {
      const ok = await accept.mutateAsync({ requestId, workerId: user?.uid ?? '' });
      if (ok) router.push(`/job/${requestId}`);
      else Alert.alert('Could not accept', 'Another worker may have taken this job.');
    } catch (e: any) {
      Alert.alert('Could not accept', e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (requestId: string) => {
    setBusyId(requestId);
    try {
      await reject.mutateAsync({ requestId, workerId: user?.uid ?? '' });
      refreshAll();
    } catch (e: any) {
      Alert.alert('Could not decline', e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refreshAll} tintColor={colors.primary} />}
    >
      <View className="px-5 pt-14 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="font-display text-2xl text-primary">Incoming</Text>
          <Text className="text-muted-fg text-xs mt-1">
            {requests.length ? `${requests.length} job${requests.length === 1 ? '' : 's'} waiting` : 'Nothing waiting'}
          </Text>
        </View>
        <OnlineToggle
          value={profile?.isOnline ?? false}
          pending={availability.isPending}
          onChange={(next) => user?.uid && availability.mutate({ userId: user.uid, isOnline: next })}
        />
      </View>

      <View className="px-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No new jobs"
            body={
              profile?.isOnline
                ? 'You are online. Requests in your area will appear here the moment they arrive.'
                : 'Go online to start receiving requests from customers near you.'
            }
            action={
              profile?.isOnline ? undefined : (
                <Button
                  label="Go online"
                  onPress={() => user?.uid && availability.mutate({ userId: user.uid, isOnline: true })}
                />
              )
            }
          />
        ) : (
          requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onPress={() => router.push(`/job/${request.id}`)}
              footer={
                <View className="flex-row">
                  <View className="flex-1 mr-2">
                    <Button
                      label="Accept →"
                      fullWidth
                      loading={busyId === request.id}
                      onPress={() => onAccept(request.id)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Decline"
                      fullWidth
                      variant="outline"
                      onPress={() => onReject(request.id)}
                    />
                  </View>
                </View>
              }
            />
          ))
        )}

        {requests.length ? (
          <Text className="text-muted-fg text-xs mt-2">
            First to accept gets the job. Distances are shown from your saved work location.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}