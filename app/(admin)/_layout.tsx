import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ShieldCheck, ListChecks, Scale, Users, ScrollText, UserRound } from 'lucide-react-native';

import { useActiveStats, useVerificationQueue } from '@/hooks/use-admin';
import { colors } from '@/constants/theme';

export default function AdminLayout() {
  const { data: pendingVerifications } = useVerificationQueue('pending');
  const { data: activeStats } = useActiveStats();

  const verificationBadge = pendingVerifications?.length ? String(pendingVerifications.length) : undefined;
  const requestsBadge = activeStats?.total ? String(activeStats.total) : undefined;

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
        name="overview"
        options={{ title: 'Overview', tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="verification"
        options={{
          title: 'Verify',
          href: '/(admin)/verification',
          tabBarBadge: verificationBadge,
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarBadge: requestsBadge,
          tabBarIcon: ({ color, size }) => <ListChecks size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="disputes"
        options={{ title: 'Disputes', tabBarIcon: ({ color, size }) => <Scale size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="users"
        options={{ title: 'Users', tabBarIcon: ({ color, size }) => <Users size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="audit"
        options={{ title: 'Audit', tabBarIcon: ({ color, size }) => <ScrollText size={size} color={color} /> }}
      />
      <Tabs.Screen name="request/[id]" options={{ title: 'Request', href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: '/(admin)/profile',
          tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
