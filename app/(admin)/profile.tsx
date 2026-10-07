import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { API_BASE_URL } from '@/lib/mode';
import { useAuthStore } from '@/stores/auth';

export default function AdminProfile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-14 pb-4">
        <Text className="font-display text-2xl text-primary">Account</Text>
        <View className="mt-2 flex-row gap-2">
          <Badge label={user?.role ?? 'admin'} tone="primary" />
          {user?.adminRole ? <Badge label={user.adminRole} tone="neutral" /> : null}
        </View>
      </View>

      <View className="px-5">
        <View className="border border-border rounded-lg p-4">
          <Text className="text-foreground font-sans">{user?.name}</Text>
          <Text className="text-muted-fg text-xs mt-0.5">{user?.email}</Text>
          <Text className="text-muted-fg text-xs font-mono mt-2">{user?.uid}</Text>
        </View>

        <View className="border border-border rounded-lg p-4 mt-4">
          <Text className="text-foreground font-sans mb-1">API endpoint</Text>
          <Text className="text-muted-fg text-xs font-mono">{API_BASE_URL}</Text>
          <Text className="text-muted-fg text-xs mt-2">
            Admin actions are written to the audit log with your account id.
          </Text>
        </View>

        <Button label="Sign out" fullWidth variant="destructive" className="mt-6" onPress={onLogout} />
      </View>
    </ScrollView>
  );
}