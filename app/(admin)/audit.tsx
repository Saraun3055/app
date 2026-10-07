import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAuditLog } from '@/hooks/use-admin';
import { colors } from '@/constants/theme';

function actionTone(action: string): 'primary' | 'success' | 'warning' | 'destructive' | 'neutral' {
  if (/approve|resolve|complete|paid|reinstate/i.test(action)) return 'success';
  if (/reject|cancel|suspend|dispute/i.test(action)) return 'destructive';
  if (/create|submit|assign|accept/i.test(action)) return 'primary';
  if (/update|review/i.test(action)) return 'warning';
  return 'neutral';
}

export default function AdminAudit() {
  const { data, isLoading, refetch, isRefetching } = useAuditLog();
  const entries = data ?? [];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View className="px-5 pt-14 pb-3">
        <Text className="font-display text-2xl text-primary">Audit log</Text>
        <Text className="text-muted-fg text-xs mt-1">
          Every privileged action, kept for accountability.
        </Text>
      </View>

      <View className="px-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : entries.length === 0 ? (
          <EmptyState title="Nothing logged yet" body="Admin actions will be recorded here as they happen." />
        ) : (
          entries.map((entry) => (
            <View key={entry.id} className="flex-row mb-4">
              <View className="w-16 shrink-0">
                <Text className="text-muted-fg text-xs font-mono">
                  {new Date(entry.timestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View className="flex-1 border-l border-border pl-4">
                <Badge label={entry.action} tone={actionTone(entry.action)} />
                <Text className="text-muted-fg text-xs mt-1.5 font-mono">
                  by {entry.actorId?.slice(0, 18) ?? 'system'} ({entry.actorRole})
                </Text>
                <Text className="text-foreground text-sm font-mono mt-0.5">
                  {entry.targetId ? entry.targetId.slice(0, 22) : '—'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}