import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Inbox, History, BadgeCheck, UserRound } from 'lucide-react-native';

import { colors } from '@/constants/theme';

export default function WorkerLayout() {
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
        options={{ title: 'Incoming', tabBarIcon: ({ color, size }) => <Inbox size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'Jobs', tabBarIcon: ({ color, size }) => <History size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="verification"
        options={{ title: 'Verify', tabBarIcon: ({ color, size }) => <BadgeCheck size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} /> }}
      />
      <Tabs.Screen name="job/[id]" options={{ title: 'Job', href: null }} />
    </Tabs>
  );
}