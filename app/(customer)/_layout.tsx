import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, PlusCircle, UserRound } from 'lucide-react-native';

import { colors } from '@/constants/theme';

export default function CustomerLayout() {
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
        name="new"
        options={{ title: 'New Request', tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: '/(customer)/profile',
          tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="new/workers" options={{ href: null }} />
      <Tabs.Screen name="requests/[id]" options={{ href: null }} />
      <Tabs.Screen name="rate/[id]" options={{ href: null }} />
      <Tabs.Screen name="complaint/[id]" options={{ href: null }} />
    </Tabs>
  );
}