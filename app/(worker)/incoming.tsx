import React, { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RequestCard } from '@/components/RequestCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { StatusBadge } from '@/components/ui/Badge';
import { JobProgressStepper } from '@/components/JobProgressStepper';
import { OnlineToggle } from '@/components/OnlineToggle';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAcceptRequest, useRejectRequest, useWorkerIncoming, useWorkerJobs } from '@/hooks/use-requests';
import { useBackgroundChangeNotification } from '@/hooks/use-notifications';
import { useSetAvailability, useWorkerProfile } from '@/hooks/use-workers';
import { haversine } from '@/lib/geo';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';
import type { ServiceRequestDoc } from '@/lib/types';

const SORTS = ['Nearby', 'Same pincode', 'All Madurai'] as const;
type SortKey = (typeof SORTS)[number];

const ACTIVE_STATUSES: string[] = ['accepted', 'on_the_way', 'arrived', 'in_progress'];

export default function Incoming() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: profile, refetch: refetchProfile } = useWorkerProfile(user?.uid);
  const { data, isLoading, refetch, isRefetching } = useWorkerIncoming(user?.uid);
  const { data: jobs } = useWorkerJobs(user?.uid);
  const accept = useAcceptRequest();
  const reject = useRejectRequest();
  const availability = useSetAvailability();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('Nearby');

  const requests = useMemo(() => data ?? [], [data]);

  const distanceFor = (request: ServiceRequestDoc) => {
    const origin = profile?.g?.geopoint;
    if (!origin || !request.customerLocation) return null;
    return haversine(origin, request.customerLocation);
  };

  const sortedRequests = useMemo(() => {
    const list = [...requests];
    if (sort === 'All Madurai') {
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    if (sort === 'Same pincode') {
      const mine = profile?.pincode;
      if (!mine) return [];
      return list
        .filter((r) => r.customerPincode && r.customerPincode === mine)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const origin = profile?.g?.geopoint;
    const dist = (r: ServiceRequestDoc) =>
      origin && r.customerLocation ? haversine(origin, r.customerLocation) : null;
    return list.sort((a, b) => {
      const da = dist(a);
      const db = dist(b);
      if (da === null && db === null) return b.createdAt.localeCompare(a.createdAt);
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }, [requests, sort, profile]);

  const activeJobs = useMemo(
    () => (jobs ?? []).filter((j) => ACTIVE_STATUSES.includes(j.status)),
    [jobs],
  );

  const countChanged = (a: ServiceRequestDoc[], b: ServiceRequestDoc[]) => a.length === b.length;
  const buildNewRequestNotice = (next: ServiceRequestDoc[]) => {
    const newest = next[0];
    if (!newest) return null;
    return {
      title: 'New job near you',
      body: `${newest.category} · ${newest.customerArea ?? 'your area'}`,
      url: '/(worker)/incoming',
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

      {activeJobs.length ? (
        <View className="px-5 mb-6">
          <Text className="font-display text-lg text-primary mb-3">Your active jobs</Text>
          {activeJobs.map((job) => (
            <Pressable
              key={job.id}
              accessibilityRole="button"
              onPress={() => router.push(`/job/${job.id}`)}
              className="border border-border rounded-lg p-4 mb-3"
            >
              <View className="flex-row items-start justify-between">
                <Text className="text-foreground font-sans flex-1 pr-2">{job.title}</Text>
                <StatusBadge status={job.status} />
              </View>
              <Text className="text-muted-fg text-xs mt-1">{job.customerName}</Text>
              <View className="mt-3">
                <JobProgressStepper status={job.status} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View className="flex-row px-5 mb-3">
        {SORTS.map((option) => (
          <Chip key={option} label={option} selected={sort === option} onPress={() => setSort(option)} />
        ))}
      </View>

      <View className="px-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : sortedRequests.length === 0 ? (
          <EmptyState
            title="No new jobs"
            body={
              requests.length === 0
                ? profile?.isOnline
                  ? 'You are online. Requests in your area will appear here the moment they arrive.'
                  : 'Go online to start receiving requests from customers near you.'
                : 'No waiting requests match this filter right now.'
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
          sortedRequests.map((request) => {
            const distance = distanceFor(request);
            return (
              <RequestCard
                key={request.id}
                request={request}
                onPress={() => router.push(`/job/${request.id}`)}
                footer={
                  <View>
                    {distance !== null ? (
                      <Text className="text-muted-fg text-xs mb-2">{(distance / 1000).toFixed(1)} km</Text>
                    ) : null}
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
                  </View>
                }
              />
            );
          })
        )}

        {sortedRequests.length ? (
          <Text className="text-muted-fg text-xs mt-2">
            First to accept gets the job. Distances are shown from your saved work location.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}