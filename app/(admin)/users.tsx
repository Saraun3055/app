import React, { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAdminUsers, useSetUserSuspended } from '@/hooks/use-admin';
import { colors } from '@/constants/theme';
import type { UserDoc } from '@/lib/types';

const ROLE_FILTERS = ['all', 'customer', 'worker', 'admin'] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function AdminUsers() {
  const { data, isLoading, refetch, isRefetching } = useAdminUsers();
  const suspend = useSetUserSuspended();
  const [role, setRole] = useState<RoleFilter>('all');
  const [query, setQuery] = useState('');

  const users = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((u: UserDoc) => {
      if (role !== 'all' && u.role !== role) return false;
      if (!needle) return true;
      return (
        u.name?.toLowerCase().includes(needle) ||
        u.email?.toLowerCase().includes(needle) ||
        u.phone?.includes(needle)
      );
    });
  }, [users, role, query]);

  const toggleSuspend = (u: UserDoc) => {
    const next = !u.suspended;
    Alert.alert(
      next ? `Suspend ${u.name}?` : `Reinstate ${u.name}?`,
      next
        ? 'They will be blocked from signing in and from accepting jobs.'
        : 'They will regain full access immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Suspend' : 'Reinstate',
          style: next ? 'destructive' : 'default',
          onPress: () =>
            suspend.mutate(
              { uid: u.uid, suspended: next },
              {
                onSuccess: (ok) => {
                  if (ok) refetch();
                  else Alert.alert('Could not update', 'Please try again.');
                },
                onError: () => Alert.alert('Could not update', 'Please try again.'),
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
        <Text className="font-display text-2xl text-primary">Users</Text>
        <Text className="text-muted-fg text-xs mt-1">{users.length} accounts registered.</Text>
      </View>

      <View className="px-5 mb-3">
        <Input
          placeholder="Search name, email, phone"
          placeholderTextColor={colors.mutedFg}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View className="flex-row px-5 mb-4 flex-wrap">
        {ROLE_FILTERS.map((option) => (
          <Chip key={option} label={option} selected={role === option} onPress={() => setRole(option)} />
        ))}
      </View>

      <View className="px-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching users" body="Try a different name, email, or role filter." />
        ) : (
          filtered.map((u: UserDoc) => (
            <View key={u.uid} className="border border-border rounded-lg p-4 mb-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
                  <Text className="text-primary font-mono text-sm">{initials(u.name)}</Text>
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-foreground font-sans">{u.name}</Text>
                  <Text className="text-muted-fg text-xs">{u.email ?? u.phone ?? '—'}</Text>
                </View>

                <Badge label={u.role} tone={u.role === 'admin' ? 'primary' : 'neutral'} />
              </View>

              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-muted-fg text-xs">
                  {u.area ? `${u.area} · ` : ''}
                  joined {new Date(u.createdAt).toLocaleDateString('en-IN')}
                </Text>

                {u.suspended ? <Badge label="Suspended" tone="destructive" /> : null}
              </View>

              {u.role !== 'admin' ? (
                <Button
                  label={u.suspended ? 'Reinstate' : 'Suspend'}
                  size="sm"
                  variant={u.suspended ? 'outline' : 'destructive'}
                  loading={suspend.isPending}
                  className="mt-3"
                  onPress={() => toggleSuspend(u)}
                />
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}