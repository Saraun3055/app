import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Stars } from '@/components/ui/Stars';
import { colors } from '@/constants/theme';
import { useRateWorker, useRequestLive } from '@/hooks/use-requests';
import { useAuthStore } from '@/stores/auth';

export default function RateWorker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: request, isLoading } = useRequestLive(id);
  const rate = useRateWorker();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-background px-5 pt-16">
        <SkeletonCard lines={3} />
      </ScrollView>
    );
  }

  if (!request?.workerId) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="font-display text-lg text-primary mb-4">Nothing to rate yet</Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  const submit = async () => {
    try {
      const ok = await rate.mutateAsync({
        requestId: request.id,
        workerId: request.workerId as string,
        customerId: user?.uid ?? '',
        customerName: user?.name ?? 'Customer',
        rating,
        comment: comment.trim() || undefined,
      });
      if (ok) {
        Alert.alert('Thanks!', 'Your rating helps other customers pick with confidence.', [
          { text: 'Done', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Could not save rating', 'Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Could not save rating', e?.message ?? 'Please try again.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-14 pb-6">
        <Text className="font-display text-2xl text-primary mb-2">Rate {request.workerName ?? 'your worker'}</Text>
        <Text className="text-muted-fg text-sm">{request.title}</Text>
      </View>

      <View className="mx-5 border border-border rounded-lg p-6 items-center">
        <Text className="text-foreground font-sans mb-4">How did it go?</Text>
        <Stars value={rating} onChange={setRating} size={36} />
        <Text className="text-muted-fg text-xs mt-3">{rating} of 5</Text>
      </View>

      <View className="px-5 mt-6">
        <Input
          label="Comment (optional)"
          placeholder="Was punctual? Did they clean up?"
          placeholderTextColor={colors.mutedFg}
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <Button label="Submit rating" fullWidth loading={rate.isPending} onPress={submit} />
      </View>
    </ScrollView>
  );
}