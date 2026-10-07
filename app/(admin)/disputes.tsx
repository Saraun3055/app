import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { DisputeBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useDisputes, useResolveDispute } from '@/hooks/use-admin';
import { colors } from '@/constants/theme';
import type { DisputeStatus } from '@/lib/types';

const FILTERS: (DisputeStatus | '')[] = ['open', 'resolved', ''];
const FILTER_LABEL: Record<string, string> = { open: 'Open', resolved: 'Resolved', '': 'All' };

function ResolveForm({ disputeId, onDone }: { disputeId: string; onDone: () => void }) {
  const [note, setNote] = useState('');
  const resolve = useResolveDispute();

  return (
    <View className="mt-3 border-t border-border pt-3">
      <Input
        label="Resolution"
        placeholder="Refund issued, worker warned, replaced part free of charge…"
        placeholderTextColor={colors.mutedFg}
        value={note}
        onChangeText={setNote}
        multiline
      />
      <Button
        label="Mark resolved"
        fullWidth
        loading={resolve.isPending}
        disabled={!note.trim()}
        onPress={() =>
          resolve.mutate(
            { disputeId, resolutionNote: note.trim() },
            {
              onSuccess: (ok) => {
                if (ok) {
                  setNote('');
                  onDone();
                } else {
                  Alert.alert('Could not resolve', 'Please try again.');
                }
              },
              onError: () => Alert.alert('Could not resolve', 'Please try again.'),
            },
          )
        }
      />
    </View>
  );
}

export default function AdminDisputes() {
  const router = useRouter();
  const [filter, setFilter] = useState<DisputeStatus | ''>('open');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const { data, isLoading, refetch, isRefetching } = useDisputes(filter);
  const disputes = data ?? [];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View className="px-5 pt-14 pb-3">
        <Text className="font-display text-2xl text-primary">Disputes</Text>
        <Text className="text-muted-fg text-xs mt-1">
          Complaints raised by customers on a completed or in-flight job.
        </Text>
      </View>

      <View className="flex-row px-5 mb-4">
        {FILTERS.map((option) => (
          <Chip
            key={option || 'all'}
            label={FILTER_LABEL[option]}
            selected={filter === option}
            onPress={() => setFilter(option)}
          />
        ))}
      </View>

      <View className="px-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : disputes.length === 0 ? (
          <EmptyState title="Nothing to resolve" body="No disputes match this filter." />
        ) : (
          disputes.map((dispute) => (
            <View key={dispute.id} className="border border-border rounded-lg p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-display text-lg flex-1 pr-2">{dispute.reason}</Text>
                <DisputeBadge status={dispute.status} />
              </View>

              <Text className="text-muted-fg text-xs mb-2">
                Raised by {dispute.raisedBy} · {new Date(dispute.createdAt).toLocaleDateString('en-IN')}
              </Text>

              <Text className="text-foreground text-sm">{dispute.description}</Text>

              <Text
                accessibilityRole="button"
                className="text-muted-fg text-xs font-mono mt-3 underline"
                onPress={() =>
                  dispute.requestId
                    ? router.push(`/(admin)/request/${dispute.requestId}`)
                    : Alert.alert('Request', 'This dispute is not linked to a job.')
                }
              >
                Job {dispute.requestId.slice(0, 16)}…
              </Text>

              {dispute.status === 'resolved' && dispute.resolutionNote ? (
                <View className="mt-3 border-l-2 border-success pl-3">
                  <Text className="text-muted-fg text-xs uppercase tracking-wide">Resolution</Text>
                  <Text className="text-foreground text-sm mt-1">{dispute.resolutionNote}</Text>
                </View>
              ) : null}

              {dispute.status === 'open' ? (
                resolvingId === dispute.id ? (
                  <ResolveForm disputeId={dispute.id} onDone={() => setResolvingId(null)} />
                ) : (
                  <Button
                    label="Resolve"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onPress={() => setResolvingId(dispute.id)}
                  />
                )
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}