import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PincodePicker } from '@/components/PincodePicker';
import { colors } from '@/constants/theme';
import { MADURAI_CENTER, type MaduraiLocation } from '@/lib/madurai-locations';
import { updateMyProfile } from '@/services/profile.service';
import { useAuthStore } from '@/stores/auth';

export default function Profile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const applyProfile = useAuthStore((s) => s.applyProfile);
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [pincode, setPincode] = useState(user?.pincode ?? '');
  const [area, setArea] = useState(user?.area ?? '');
  const [saving, setSaving] = useState(false);

  const [seedUser, setSeedUser] = useState(user);
  if (user !== seedUser) {
    setSeedUser(user);
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setPincode(user?.pincode ?? '');
    setArea(user?.area ?? '');
  }

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Your name is shown to workers before they arrive.');
      return;
    }
    try {
      setSaving(true);
      const ok = await updateMyProfile({
        name: name.trim(),
        phone: phone.trim(),
        pincode: pincode.trim(),
        area: area.trim(),
      });
      if (!ok) {
        Alert.alert('Could not save', 'Please check your connection and try again.');
        return;
      }
      applyProfile({ name: name.trim(), phone: phone.trim(), pincode: pincode.trim(), area: area.trim() });
      Alert.alert('Profile updated');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-14 pb-4">
        <Text className="font-display text-2xl text-primary">Profile</Text>
        <View className="mt-2">
          <Badge label={user?.role === 'admin' ? 'Admin' : 'Customer'} tone="primary" />
        </View>
      </View>

      <View className="px-5">
        <Input
          label="Email"
          value={user?.email ?? ''}
          onChangeText={() => undefined}
          editable={false}
          placeholderTextColor={colors.mutedFg}
        />
        <Input label="Display name" value={name} onChangeText={setName} placeholderTextColor={colors.mutedFg} />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={colors.mutedFg}
          hint="Workers see this to coordinate arrival"
        />

        <PincodePicker
          value={pincode || null}
          label="Home area"
          onSelect={(loc: MaduraiLocation) => {
            setPincode(loc.pincode);
            setArea(loc.name);
          }}
        />
        {area ? <Text className="text-muted-fg text-xs -mt-2 mb-4">Home area: {area}</Text> : null}

        <Button label="Save changes" fullWidth loading={saving} onPress={save} />

        <View className="mt-8 border border-border rounded-lg p-4">
          <Text className="text-foreground font-sans mb-1">Signed in as</Text>
          <Text className="text-muted-fg text-xs font-mono">
            {user?.uid ? user.uid.slice(0, 18) : 'unknown'}
          </Text>
          <Text className="text-muted-fg text-xs mt-1">
            Madurai centre fallback: {MADURAI_CENTER.lat}, {MADURAI_CENTER.lng}
          </Text>
        </View>

        <Button label="Sign out" fullWidth variant="destructive" onPress={onLogout} className="mt-6" />
      </View>
    </ScrollView>
  );
}