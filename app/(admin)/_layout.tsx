import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ShieldCheck, ListChecks, Scale, Users, ScrollText } from 'lucide-react-native';

import { colors } from '@/constants/theme';

export default function AdminLayout() {
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
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{ title: 'Requests', tabBarIcon: ({ color, size }) => <ListChecks size={size} color={color} /> }}
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
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}