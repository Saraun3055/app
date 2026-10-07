import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageCircle, Receipt } from 'lucide-react-native';

import { Badge, PaymentBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JobProgressStepper } from '@/components/JobProgressStepper';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Stars } from '@/components/ui/Stars';
import { WhatsAppHandoff } from '@/components/WhatsAppHandoff';
import { useCancelRequest, usePayRequest, useRequestLive } from '@/hooks/use-requests';
import { useBackgroundChangeNotification } from '@/hooks/use-notifications';
import { useWorkerProfile } from '@/hooks/use-workers';
import { colors } from '@/constants/theme';
import { STATUS_LABEL } from '@/lib/types';
import type { PaymentMethod, ServiceRequestDoc } from '@/lib/types';

const CANCELLABLE: string[] = ['searching', 'pending_worker_response'];

const STATUS_HEADLINE: Record<string, string> = {
  searching: 'Finding a worker',
  pending_worker_response: 'Request sent',
  accepted: 'A worker accepted your job',
  on_the_way: 'Your worker is on the way',
  arrived: 'Your worker has arrived',
  in_progress: 'Work is underway',
  completed: 'Job completed',
  cancelled: 'Request cancelled',
};

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: request, isLoading, refetch, isRefetching } = useRequestLive(id);
  const { data: worker } = useWorkerProfile(request?.workerId);
  const pay = usePayRequest();
  const cancel = useCancelRequest();
  const [method, setMethod] = useState<PaymentMethod>('cash');

  const sameStatus = (a: ServiceRequestDoc | undefined, b: ServiceRequestDoc | undefined) =>
    a?.status === b?.status && a?.paymentStatus === b?.paymentStatus;
  const buildStatusNotice = (next: ServiceRequestDoc | undefined) =>
    next
      ? {
          title: STATUS_HEADLINE[next.status] ?? 'Request updated',
          body: `${next.title} — ${STATUS_LABEL[next.status]}`,
          url: `/(customer)/requests/${next.id}`,
        }
      : null;

  useBackgroundChangeNotification<ServiceRequestDoc | undefined>(request ?? undefined, sameStatus, buildStatusNotice);

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
        <Text className="font-display text-lg text-primary mb-2">Request not found</Text>
        <Text className="text-muted-fg text-center mb-5">
          This request may have been removed, or the link is out of date.
        </Text>
        <Button label="Back to dashboard" onPress={() => router.replace('/(customer)/dashboard')} />
      </View>
    );
  }

  const { bill } = request;
  const awaitingPayment = request.status === 'completed' && request.paymentStatus !== 'paid';
  const canCancel = CANCELLABLE.includes(request.status);

  const onPay = async () => {
    try {
      const ok = await pay.mutateAsync({ requestId: request.id, method });
      if (ok) Alert.alert('Payment recorded', `Marked as paid by ${method.toUpperCase()}.`);
      else Alert.alert('Payment failed', 'Please try again.');
    } catch (e: any) {
      Alert.alert('Payment failed', e?.message ?? 'Please try again.');
    }
  };

  const onCancel = async () => {
    try {
      const ok = await cancel.mutateAsync(request.id);
      if (ok) Alert.alert('Request cancelled');
      else Alert.alert('Could not cancel', 'The worker may have already accepted.');
    } catch (e: any) {
      Alert.alert('Could not cancel', e?.message ?? 'Please try again.');
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7A1B1C" />}
    >
      <View className="px-5 pt-14 pb-4">
        <Text className="font-display text-2xl text-primary">{request.title}</Text>
        <Text className="text-muted-fg text-xs mt-1">
          {request.category} · {request.customerArea ?? request.customerPincode ?? 'Madurai'}
        </Text>
        <View className="mt-3">
          <StatusBadge status={request.status} />
        </View>
      </View>

      <View className="mx-5 border border-border rounded-lg p-4 bg-background">
        <JobProgressStepper status={request.status} />
      </View>

      {request.description ? (
        <View className="mx-5 mt-4">
          <Text className="text-foreground font-sans">{request.description}</Text>
        </View>
      ) : null}

      {worker || request.workerName ? (
        <View className="mx-5 mt-5 border border-border rounded-lg p-4 bg-background">
          <Text className="text-muted-fg text-xs uppercase tracking-wide mb-2">Your worker</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-foreground font-display text-lg">{worker?.name ?? request.workerName}</Text>
              {worker ? (
                <View className="mt-1">
                  <Stars value={worker.rating} size={13} showValue count={worker.ratingCount} />
                </View>
              ) : null}
              {worker?.categorySkills?.length ? (
                <Text className="text-muted-fg text-xs mt-1">{worker.categorySkills.join(' · ')}</Text>
              ) : null}
            </View>
            {worker?.phone || request.whatsappNumber ? (
              <View className="ml-3 flex-1">
                <WhatsAppHandoff
                  phone={worker?.phone ?? request.whatsappNumber ?? ''}
                  requestTitle={request.title}
                />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {bill ? (
        <View className="mx-5 mt-5 border border-border rounded-lg p-4 bg-background">
          <View className="flex-row items-center mb-3">
            <Receipt size={15} color="#7A1B1C" />
            <Text className="font-display text-base text-primary ml-2">Bill</Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-muted-fg text-sm">Products</Text>
            <Text className="text-foreground text-sm font-mono">₹{bill.productsCost}</Text>
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-muted-fg text-sm">Labour</Text>
            <Text className="text-foreground text-sm font-mono">₹{bill.laborWage}</Text>
          </View>
          <View className="h-px bg-border my-3" />
          <View className="flex-row justify-between">
            <Text className="text-foreground font-sans">Total</Text>
            <Text className="text-primary font-mono font-semibold">₹{bill.total}</Text>
          </View>

          {bill.note ? <Text className="text-muted-fg text-xs mt-2">{bill.note}</Text> : null}

          {awaitingPayment ? (
            <View className="mt-4">
              <Text className="text-foreground font-sans mb-2">Payment method</Text>
              <View className="flex-row gap-3 mb-4">
                {(['cash', 'upi'] as PaymentMethod[]).map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: method === option }}
                    onPress={() => setMethod(option)}
                    className={`flex-1 rounded-md border px-3 py-2 items-center ${
                      method === option ? 'border-primary bg-secondary' : 'border-border'
                    }`}
                  >
                    <Text className={method === option ? 'text-primary font-sans uppercase' : 'text-muted-fg font-sans uppercase'}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Button label={`Pay ₹${bill.total}`} fullWidth loading={pay.isPending} onPress={onPay} />
            </View>
          ) : (
            <View className="mt-4 flex-row items-center gap-2">
              <PaymentBadge status={request.paymentStatus} />
              {request.paymentMethod ? <Badge label={request.paymentMethod.toUpperCase()} tone="neutral" /> : null}
            </View>
          )}
        </View>
      ) : null}

      {request.status === 'completed' && !request.ratingGiven ? (
        <View className="mx-5 mt-5">
          <Button
            label="Rate this worker"
            fullWidth
            variant="outline"
            onPress={() => router.push(`/rate/${request.id}`)}
          />
        </View>
      ) : null}

      {canCancel ? (
        <View className="mx-5 mt-5">
          <Button label="Cancel request" fullWidth variant="destructive" loading={cancel.isPending} onPress={onCancel} />
        </View>
      ) : null}

      <View className="mx-5 mt-5 flex-row items-center gap-2">
        <MessageCircle size={13} color={colors.mutedFg} />
        <Pressable accessibilityRole="button" onPress={() => router.push(`/complaint/${request.id}`)}>
          <Text className="text-muted-fg text-xs underline">Something went wrong? Raise a complaint</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}