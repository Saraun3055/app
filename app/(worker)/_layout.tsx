import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Inbox, History, BadgeCheck, UserRound } from 'lucide-react-native';

import { colors } from '@/constants/theme';
import { useWorkerIncoming } from '@/hooks/use-requests';
import { useAuthStore } from '@/stores/auth';

export default function WorkerLayout() {
  const user = useAuthStore((s) => s.user);
  const { data: incoming } = useWorkerIncoming(user?.uid);
  const pendingCount = incoming?.length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedFg,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="incoming"
        options={{
          title: 'Incoming',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarIcon: ({ color, size }) => <Inbox size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'Jobs', tabBarIcon: ({ color, size }) => <History size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="verification"
        options={{
          title: 'Verify',
          href: '/(worker)/verification',
          tabBarIcon: ({ color, size }) => <BadgeCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: '/(worker)/profile',
          tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="job/[id]" options={{ title: 'Job', href: null }} />
    </Tabs>
  );
}