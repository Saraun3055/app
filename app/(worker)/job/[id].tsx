import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { JobProgressStepper } from '@/components/JobProgressStepper';
import { MapViewWrapper } from '@/components/MapView';
import { PaymentBadge, StatusBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { WhatsAppHandoff } from '@/components/WhatsAppHandoff';
import { useCompleteRequest, useRequestLive, useUpdateJobProgress } from '@/hooks/use-requests';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';
import type { GeoPointLike, JobProgressStatus, RequestStatus } from '@/lib/types';

/**
 * The backend only allows accepted → on_the_way → arrived → in_progress, so
 * 'accepted' is an implicit starting point even though it is not a step the
 * worker advances *to*.
 */
const ADVANCE_FROM: Partial<Record<RequestStatus, JobProgressStatus>> = {
  accepted: 'on_the_way',
  on_the_way: 'arrived',
  arrived: 'in_progress',
};

const STEP_LABEL: Record<JobProgressStatus, string> = {
  on_the_way: 'On the way',
  arrived: 'Arrived',
  in_progress: 'Working',
};

const STEP_HELPER: Record<JobProgressStatus, string> = {
  on_the_way: 'Start travelling to the customer',
  arrived: 'You are at the location',
  in_progress: 'Begin the job',
};

const DEFAULT_COORDS: GeoPointLike = { latitude: 9.9252, longitude: 78.1198 };

export default function WorkerJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: request, isLoading } = useRequestLive(id);
  const advance = useUpdateJobProgress();
  const complete = useCompleteRequest();

  const [productsCost, setProductsCost] = useState('');
  const [laborWage, setLaborWage] = useState('');
  const [note, setNote] = useState('');

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-background px-5 pt-16">
        <SkeletonCard lines={4} />
      </ScrollView>
    );
  }

  if (!request) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="font-display text-lg text-primary mb-4">Job not found</Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  const site = request.customerLocation ?? DEFAULT_COORDS;
  const nextStatus = ADVANCE_FROM[request.status];
  const canComplete = request.status === 'in_progress';
  const isMine = !user?.uid || !request.workerId || request.workerId === user.uid;

  const tap = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const onAdvance = async () => {
    if (!nextStatus) return;
    tap();
    try {
      const ok = await advance.mutateAsync({ requestId: request.id, status: nextStatus });
      if (!ok) Alert.alert('Could not update', 'Please try again.');
    } catch (e: any) {
      Alert.alert('Could not update', e?.message ?? 'Please try again.');
    }
  };

  const onComplete = async () => {
    const products = Number(productsCost);
    const labor = Number(laborWage);

    if (Number.isNaN(products) || Number.isNaN(labor) || products < 0 || labor < 0) {
      Alert.alert('Enter the bill amounts', 'Products and labour both need to be zero or more.');
      return;
    }

    try {
      const ok = await complete.mutateAsync({
        requestId: request.id,
        workerId: request.workerId ?? user?.uid ?? '',
        productsCost: products,
        laborWage: labor,
        note: note.trim() || undefined,
      });
      if (ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        Alert.alert('Job completed', 'The customer can now pay you.', [
          { text: 'Done', onPress: () => router.replace('/(worker)/jobs') },
        ]);
      } else {
        Alert.alert('Could not complete', 'Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Could not complete', e?.message ?? 'Please try again.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 48 }}>
      <View className="px-5 pt-14 pb-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-display text-2xl text-primary">{request.title}</Text>
            <Text className="text-muted-fg text-xs mt-1">
              {request.category} · {request.customerName}
            </Text>
          </View>
          <StatusBadge status={request.status} />
        </View>
      </View>

      <View className="px-5">
        <MapViewWrapper
          pins={[{ id: 'site', coordinate: site, label: request.customerArea ?? 'Job site', tint: colors.primary }]}
          fallback={site}
          height={180}
        />
        {request.customerAddress ? (
          <Text className="text-muted-fg text-xs mt-2">{request.customerAddress}</Text>
        ) : null}
      </View>

      <View className="mx-5 mt-5 border border-border rounded-lg p-4">
        <JobProgressStepper status={request.status} />
      </View>

      {request.whatsappNumber ? (
        <View className="mx-5 mt-5">
          <WhatsAppHandoff
            phone={request.whatsappNumber}
            requestTitle={request.title}
          />
        </View>
      ) : null}

      {request.description ? (
        <View className="mx-5 mt-5">
          <Text className="text-foreground font-sans">{request.description}</Text>
        </View>
      ) : null}

      {request.photoUrls?.length ? (
        <View className="mx-5 mt-4 flex-row flex-wrap gap-2">
          {request.photoUrls.map((url, i) => (
            <Image
              key={`${i}-${url.slice(-16)}`}
              source={{ uri: url }}
              style={{ width: 84, height: 84, borderRadius: 8 }}
            />
          ))}
        </View>
      ) : null}

      {isMine && nextStatus ? (
        <View className="mx-5 mt-6 border border-accent rounded-lg p-4 bg-secondary">
          <Text className="text-foreground font-sans">Next: {STEP_LABEL[nextStatus]}</Text>
          <Text className="text-muted-fg text-xs mt-1">{STEP_HELPER[nextStatus]}</Text>
          <Button
            label={`Mark as ${STEP_LABEL[nextStatus]}`}
            fullWidth
            loading={advance.isPending}
            onPress={onAdvance}
            className="mt-3"
          />
        </View>
      ) : null}

      {isMine && canComplete ? (
        <View className="mx-5 mt-6 border border-border rounded-lg p-4">
          <Text className="font-display text-lg text-primary mb-1">Finish and bill</Text>
          <Text className="text-muted-fg text-xs mb-4">
            Enter what you charged. The customer sees this and confirms payment.
          </Text>

          <Input
            label="Products / parts cost"
            value={productsCost}
            onChangeText={setProductsCost}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.mutedFg}
          />
          <Input
            label="Labour wage"
            value={laborWage}
            onChangeText={setLaborWage}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.mutedFg}
          />
          <Input
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Parts replaced, warranty details…"
            placeholderTextColor={colors.mutedFg}
          />

          <View className="border-t border-border pt-3 mt-1 mb-4">
            <View className="flex-row justify-between">
              <Text className="text-muted-fg text-sm">Total</Text>
              <Text className="font-mono text-primary">
                ₹{(Number(productsCost) || 0) + (Number(laborWage) || 0)}
              </Text>
            </View>
          </View>

          <Button label="Complete job" fullWidth loading={complete.isPending} onPress={onComplete} />
        </View>
      ) : null}

      {!isMine ? (
        <Text className="text-muted-fg text-xs mx-5 mt-6 text-center">
          This job is assigned to another worker.
        </Text>
      ) : null}

      {request.status === 'completed' ? (
        <View className="mx-5 mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-muted-fg text-xs uppercase tracking-wide">Payment</Text>
            <PaymentBadge status={request.paymentStatus} />
          </View>
          {request.bill ? (
            <View className="border border-border rounded-lg p-4">
              <View className="flex-row justify-between">
                <Text className="text-muted-fg text-sm">Products</Text>
                <Text className="font-mono text-sm">₹{request.bill.productsCost}</Text>
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-muted-fg text-sm">Labour</Text>
                <Text className="font-mono text-sm">₹{request.bill.laborWage}</Text>
              </View>
              <View className="h-px bg-border my-2" />
              <View className="flex-row justify-between">
                <Text className="font-sans">Total</Text>
                <Text className="font-mono font-semibold text-primary">₹{request.bill.total}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => router.back()} className="mt-8">
        <Text className="text-muted-fg text-xs text-center underline">Back to jobs</Text>
      </Pressable>
    </ScrollView>
  );
}