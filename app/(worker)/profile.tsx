import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, X } from 'lucide-react-native';

import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PincodePicker } from '@/components/PincodePicker';
import { Stars } from '@/components/ui/Stars';
import { useWorkerProfile, useWorkerRatings, useUpdateWorkerProfile } from '@/hooks/use-workers';
import { CATEGORY_LIST } from '@/lib/types';
import type { MaduraiLocation } from '@/lib/madurai-locations';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';
import type { AvailabilitySlot } from '@/lib/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export default function WorkerProfile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading } = useWorkerProfile(user?.uid);
  const { data: ratings } = useWorkerRatings(user?.uid);
  const update = useUpdateWorkerProfile();

  const [skills, setSkills] = useState<string[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [saving, setSaving] = useState(false);

  const [seedProfile, setSeedProfile] = useState(profile);
  if (profile !== seedProfile) {
    setSeedProfile(profile);
    setSkills(profile?.categorySkills ?? []);
    setSlots(profile?.availableSlots ?? []);
    setBio(profile?.bio ?? '');
    setAddress(profile?.address ?? '');
    setPincode(profile?.pincode ?? '');
    setArea(profile?.area ?? '');
  }

  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      JSON.stringify(skills) !== JSON.stringify(profile.categorySkills ?? []) ||
      JSON.stringify(slots) !== JSON.stringify(profile.availableSlots ?? []) ||
      bio !== (profile.bio ?? '') ||
      address !== (profile.address ?? '') ||
      pincode !== (profile.pincode ?? '') ||
      area !== (profile.area ?? '')
    );
  }, [skills, slots, bio, address, pincode, area, profile]);

  const toggleSkill = (category: string) => {
    setSkills((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const slotFor = (day: string) => slots.find((s) => s.day === day);

  const setSlot = (day: string, from: string, to: string) => {
    setSlots((prev) => {
      const rest = prev.filter((s) => s.day !== day);
      if (!from || !to) return rest;
      return [...rest, { day, from, to }];
    });
  };

  const save = async () => {
    if (skills.length === 0) {
      Alert.alert('Pick at least one skill', 'Customers filter by category, so an empty profile gets no jobs.');
      return;
    }
    try {
      setSaving(true);
      const ok = await update.mutateAsync({
        userId: user?.uid ?? '',
        categorySkills: skills,
        availableSlots: slots,
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        area: area.trim() || undefined,
        bio: bio.trim(),
      });
      if (ok) Alert.alert('Profile saved', 'Customers can now see your updated skills and slots.');
      else Alert.alert('Could not save', 'Please try again.');
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
      <View className="px-5 pt-14 pb-3">
        <Text className="font-display text-2xl text-primary">My profile</Text>
        <View className="mt-2">
          <VerificationBadge status={profile?.verificationStatus ?? 'pending'} />
        </View>
      </View>

      <View className="px-5">
        <View className="border border-border rounded-lg p-4 mb-5">
          <Text className="text-muted-fg text-xs uppercase tracking-wide">Reputation</Text>
          <View className="flex-row items-end mt-1">
            <Text className="font-mono text-4xl text-primary">{(profile?.rating ?? 0).toFixed(1)}</Text>
            <View className="ml-3 pb-1.5">
              <Stars value={profile?.rating ?? 0} size={14} showValue count={profile?.ratingCount} />
            </View>
          </View>
          <Text className="text-muted-fg text-xs mt-2">
            {profile?.ratingCount ?? 0} ratings · {profile?.jobsCompleted ?? 0} jobs completed
          </Text>

          {ratings?.length ? (
            <View className="mt-4 border-t border-border pt-3">
              <Text className="text-muted-fg text-xs uppercase tracking-wide mb-2">What customers say</Text>
              {ratings.slice(0, 3).map((r) => (
                <View key={r.id} className="mb-2">
                  <View className="flex-row items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={11}
                        color={n <= r.rating ? colors.accent : colors.mutedFg}
                        fill={n <= r.rating ? colors.accent : 'transparent'}
                      />
                    ))}
                  </View>
                  {r.comment ? (
                    <Text className="text-foreground text-xs mt-1">{r.comment}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <Text className="text-foreground font-sans mb-2">Skills you offer</Text>
        <Text className="text-muted-fg text-xs mb-3">
          Pick every category you can handle. You only receive jobs in these categories.
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {CATEGORY_LIST.map((category: string) => {
            const active = skills.includes(category);
            return (
              <Pressable
                key={category}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                onPress={() => toggleSkill(category)}
                className={`px-3 py-2 rounded-full border ${active ? 'border-primary bg-primary' : 'border-border'}`}
              >
                <Text className={`text-xs font-sans ${active ? 'text-white' : 'text-muted-fg'}`}>{category}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="text-foreground font-sans mb-1">Weekly availability</Text>
        <Text className="text-muted-fg text-xs mb-3">
          Customers see these slots when they pick you. Leave a day blank if you do not work it.
        </Text>

        {DAYS.map((day) => {
          const slot = slotFor(day);
          return (
            <View key={day} className="flex-row items-center mb-2">
              <Text className="w-10 text-muted-fg text-sm">{day}</Text>
              <Text
                className="flex-1 text-foreground text-sm"
                accessibilityLabel={`${day} availability`}
                suppressHighlighting
              >
                {slot ? `${slot.from} – ${slot.to}` : 'Not available'}
              </Text>
              <Button
                label={slot ? 'Edit' : 'Add'}
                size="sm"
                variant="outline"
                onPress={() =>
                  slot
                    ? setSlot(day, '', '')
                    : setSlot(day, '09:00', '18:00')
                }
              />
            </View>
          );
        })}

        {slots.length ? (
          <View className="mt-4">
            {slots.map((s) => (
              <View key={s.day} className="flex-row items-center justify-between mb-1">
                <Badge label={`${s.day} ${s.from} – ${s.to}`} tone="neutral" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${s.day} availability`}
                  onPress={() => setSlot(s.day, '', '')}
                >
                  <X size={14} color={colors.mutedFg} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View className="mt-6">
          <Input
            label="About you"
            value={bio}
            onChangeText={setBio}
            placeholder="10 years on plumbing, own tools, same-day service…"
            placeholderTextColor={colors.mutedFg}
            multiline
          />
          <Input
            label="Service address"
            value={address}
            onChangeText={setAddress}
            placeholder="Street or landmark"
            placeholderTextColor={colors.mutedFg}
          />
          <PincodePicker
            value={pincode || null}
            label="Service area pincode"
            onSelect={(loc: MaduraiLocation) => {
              setAddress(loc.name);
              setPincode(loc.pincode);
              setArea(loc.name);
            }}
          />
        </View>

        <Button
          label="Save profile"
          fullWidth
          loading={saving}
          disabled={isLoading || !dirty}
          onPress={save}
          className="mt-6"
        />
        {!dirty && !isLoading ? (
          <Text className="text-muted-fg text-xs text-center mt-2">
            {isLoading ? '' : 'No changes yet.'}
          </Text>
        ) : null}

        <Button label="Sign out" fullWidth variant="destructive" onPress={onLogout} className="mt-8" />
      </View>
    </ScrollView>
  );
}