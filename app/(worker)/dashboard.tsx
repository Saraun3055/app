import React, { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';

import { Badge, PaymentBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OnlineToggle } from '@/components/OnlineToggle';
import { RequestCard } from '@/components/RequestCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Stars } from '@/components/ui/Stars';
import { useAcceptRequest, useWorkerIncoming, useWorkerJobs } from '@/hooks/use-requests';
import { useSetAvailability, useWorkerProfile } from '@/hooks/use-workers';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';

const ACTIVE_JOB_STATUSES: string[] = ['accepted', 'on_the_way', 'arrived', 'in_progress'];

export default function WorkerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useWorkerProfile(user?.uid);
  const { data: incoming, refetch: refetchIncoming } = useWorkerIncoming(user?.uid);
  const { data: jobs, refetch: refetchJobs } = useWorkerJobs(user?.uid);

  const availability = useSetAvailability();
  const accept = useAcceptRequest();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    const started = Date.now();
    void Promise.all([refetchProfile(), refetchIncoming(), refetchJobs()]).finally(() => {
      const wait = 600 - (Date.now() - started);
      setTimeout(() => setRefreshing(false), Math.max(0, wait));
    });
  };

  const recentJobs = useMemo(() => (jobs ?? []).slice(0, 4), [jobs]);
  const preview = useMemo(() => (incoming ?? []).slice(0, 3), [incoming]);
  const activeJobs = useMemo(
    () => (jobs ?? []).filter((j) => ACTIVE_JOB_STATUSES.includes(j.status)),
    [jobs],
  );

  const toggleOnline = (next: boolean) => {
    if (!user?.uid) return;
    availability.mutate(
      { userId: user.uid, isOnline: next },
      {
        onError: () => Alert.alert('Could not update', 'Check your connection and try again.'),
      },
    );
  };

  const verification = profile?.verificationStatus ?? 'pending';

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View className="px-5 pt-14 pb-4">
        <Text className="font-display text-2xl text-primary">
          Good to see you, {user?.name?.split(' ')[0] ?? 'there'}
        </Text>
      </View>

      {verification !== 'approved' ? (
        <View
          className={`mx-5 rounded-lg p-4 mb-5 border ${
            verification === 'rejected' ? 'border-destructive bg-background' : 'border-accent bg-secondary'
          }`}
        >
          <View className="flex-row items-center mb-1">
            <AlertTriangle size={15} color={verification === 'rejected' ? colors.destructive : colors.accent} />
            <Text className="ml-2 font-sans font-semibold text-foreground">
              {verification === 'rejected'
                ? 'Verification rejected'
                : verification === 'pending'
                  ? 'Verification pending'
                  : 'Submit your ID to start receiving jobs'}
            </Text>
          </View>
          <Text className="text-muted-fg text-xs">
            {verification === 'rejected'
              ? 'Re-upload a clear photo of your government ID.'
              : 'Customers only see workers whose ID has been approved.'}
          </Text>
          <Button
            label={verification === 'rejected' ? 'Re-upload ID' : 'Upload ID'}
            size="sm"
            variant="outline"
            onPress={() => router.push('/(worker)/verification')}
            className="mt-3"
          />
        </View>
      ) : null}

      <View className="mx-5 border border-border rounded-lg p-4 mb-5">
        <OnlineToggle
          value={profile?.isOnline ?? false}
          onChange={toggleOnline}
          pending={availability.isPending}
          disabled={verification !== 'approved'}
        />

        {profile?.categorySkills?.length ? (
          <View className="mt-4">
            <Text className="text-muted-fg text-xs uppercase tracking-wide mb-2">Your skills</Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.categorySkills.map((skill) => (
                <View key={skill} className="bg-secondary rounded-full px-3 py-1">
                  <Text className="text-primary text-xs">{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View className="mx-5 mb-6">
        {profileLoading ? (
          <SkeletonCard lines={2} />
        ) : (
          <View className="border border-border rounded-lg p-4">
            <View className="flex-row">
              <View className="flex-1">
                <Text className="text-muted-fg text-xs uppercase tracking-wide">Rating</Text>
                <Text className="font-mono text-3xl text-primary mt-1">
                  {(profile?.rating ?? 0).toFixed(1)}
                </Text>
                <View className="mt-1">
                  <Stars value={profile?.rating ?? 0} size={13} />
                </View>
              </View>

              <View className="flex-1 pl-4">
                <Text className="text-muted-fg text-xs uppercase tracking-wide">Jobs done</Text>
                <Text className="font-mono text-3xl text-primary mt-1">{profile?.jobsCompleted ?? 0}</Text>
                <Text className="text-muted-fg text-xs mt-1">
                  ~{profile?.avgResponseMin ?? '—'}m avg response
                </Text>
              </View>
            </View>

            <View className="mt-4">
              <Badge
                label={verification === 'approved' ? 'ID verified' : 'Not verified'}
                tone={verification === 'approved' ? 'success' : 'warning'}
              />
            </View>
          </View>
        )}
      </View>

      <View className="px-5 mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-display text-lg text-primary">Incoming</Text>
          {preview.length ? <Badge label={`${incoming?.length ?? 0} waiting`} tone="warning" /> : null}
        </View>

        {preview.length === 0 ? (
          <Text className="text-muted-fg text-sm">
            Nothing waiting. Stay online and requests from your area will appear here.
          </Text>
        ) : (
          preview.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onPress={() => router.push('/(worker)/incoming')}
              footer={
                <Button
                  label="Respond →"
                  size="sm"
                  loading={accept.isPending}
                  onPress={() =>
                    accept.mutate(
                      { requestId: request.id, workerId: user?.uid ?? '' },
                      { onError: () => Alert.alert('Could not accept', 'Please try again.') },
                    )
                  }
                />
              }
            />
          ))
        )}
      </View>

      <View className="px-5">
        <Text className="font-display text-lg text-primary mb-3">Recent jobs</Text>
        {activeJobs.length ? (
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-muted-fg text-xs uppercase tracking-wide">
              {activeJobs.length} in progress
            </Text>
            <Pressable
              accessibilityRole="link"
              hitSlop={6}
              onPress={() => router.push('/(worker)/jobs')}
            >
              <Text className="text-primary text-xs font-sans">View jobs →</Text>
            </Pressable>
          </View>
        ) : null}

        {recentJobs.length === 0 ? (
          <Text className="text-muted-fg text-sm">Completed jobs will show up here.</Text>
        ) : (
          recentJobs.map((job) => (
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
                <PaymentBadge status={job.paymentStatus} />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}