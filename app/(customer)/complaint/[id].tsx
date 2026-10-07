import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { colors } from '@/constants/theme';
import { useRaiseDispute, useRequestLive } from '@/hooks/use-requests';

const REASONS = [
  'Worker did not arrive',
  'Work quality was poor',
  'Overcharged',
  'Worker was rude or unprofessional',
  'Wrong category of work done',
  'Other',
] as const;

export default function Complaint() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: request, isLoading } = useRequestLive(id);
  const raise = useRaiseDispute();

  const [reason, setReason] = useState<string>(REASONS[0]);
  const [description, setDescription] = useState('');

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-background px-5 pt-16">
        <SkeletonCard lines={3} />
      </ScrollView>
    );
  }

  if (!request) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="font-display text-lg text-primary mb-4">Request not found</Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  const submit = async () => {
    if (!description.trim()) {
      Alert.alert('Add details', 'Describe what happened so our team can help.');
      return;
    }
    try {
      const ok = await raise.mutateAsync({ requestId: request.id, reason, description: description.trim() });
      if (ok) {
        Alert.alert('Complaint raised', 'Our support team will review this within 24 hours.', [
          { text: 'Done', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Could not submit', 'Please try again in a moment.');
      }
    } catch (e: any) {
      Alert.alert('Could not submit', e?.message ?? 'Please try again in a moment.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-14 pb-4">
        <Text className="font-display text-2xl text-primary mb-1">Raise a complaint</Text>
        <Text className="text-muted-fg text-sm">{request.title}</Text>
      </View>

      <View className="px-5">
        <Text className="text-foreground font-sans mb-2">What went wrong?</Text>
        <View className="gap-2 mb-6">
          {REASONS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === option }}
              onPress={() => setReason(option)}
              className={`border rounded-md px-4 py-3 ${
                reason === option ? 'border-primary bg-secondary' : 'border-border'
              }`}
            >
              <Text className={reason === option ? 'text-primary font-sans' : 'text-foreground font-sans'}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <Input
          label="Tell us more"
          placeholder="What happened, and what outcome would make this right?"
          placeholderTextColor={colors.mutedFg}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Button label="Submit complaint" fullWidth loading={raise.isPending} onPress={submit} />
        <Text className="text-muted-fg text-xs mt-3 text-center">
          Complaints are reviewed by the GeoFix operations team, not by the worker.
        </Text>
      </View>
    </ScrollView>
  );
}