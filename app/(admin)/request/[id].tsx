import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Badge, PaymentBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JobProgressStepper } from '@/components/JobProgressStepper';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useRequestLive } from '@/hooks/use-requests';
import { colors } from '@/constants/theme';

export default function AdminRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: request, isLoading } = useRequestLive(id);

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
        <Text className="font-display text-lg text-primary mb-4">Request not found</Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-14 pb-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-display text-2xl text-primary">{request.title}</Text>
            <Text className="text-muted-fg text-xs mt-1">{request.category}</Text>
          </View>
          <StatusBadge status={request.status} />
        </View>
      </View>

      <View className="mx-5 border border-border rounded-lg p-4">
        <JobProgressStepper status={request.status} />
      </View>

      <View className="mx-5 mt-5 border border-border rounded-lg p-4">
        <Text className="text-muted-fg text-xs uppercase tracking-wide mb-3">Parties</Text>
        <View className="flex-row justify-between">
          <Text className="text-muted-fg text-sm">Customer</Text>
          <Text className="text-foreground text-sm">{request.customerName}</Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-muted-fg text-sm">Worker</Text>
          <Text className="text-foreground text-sm">{request.workerName ?? 'Unassigned'}</Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-muted-fg text-sm">Area</Text>
          <Text className="text-foreground text-sm">
            {request.customerArea ?? '—'} {request.customerPincode ?? ''}
          </Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-muted-fg text-sm">Contact</Text>
          <Text className="text-foreground text-sm font-mono">{request.whatsappNumber ?? '—'}</Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-muted-fg text-sm">Created</Text>
          <Text className="text-foreground text-sm">
            {new Date(request.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      {request.customerAddress ? (
        <Text className="text-muted-fg text-xs mx-5 mt-4">{request.customerAddress}</Text>
      ) : null}

      {request.description ? (
        <Text className="text-foreground mx-5 mt-4">{request.description}</Text>
      ) : null}

      {request.photoUrls?.length ? (
        <View className="mx-5 mt-4 flex-row flex-wrap gap-2">
          {request.photoUrls.map((url, i) => (
            <Image
              key={`${i}-${url.slice(-16)}`}
              source={{ uri: url }}
              style={{ width: 92, height: 92, borderRadius: 8, backgroundColor: colors.secondary }}
            />
          ))}
        </View>
      ) : null}

      {request.jobUpdates?.length ? (
        <View className="mx-5 mt-5">
          <Text className="text-muted-fg text-xs uppercase tracking-wide mb-2">Timeline</Text>
          {request.jobUpdates.map((update, i) => (
            <View key={`${update.timestamp}-${i}`} className="flex-row mb-2">
              <Text className="w-24 text-muted-fg text-xs font-mono">
                {new Date(update.timestamp).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <View className="flex-1">
                <StatusBadge status={update.status} />
                {update.note ? <Text className="text-muted-fg text-xs mt-1">{update.note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mx-5 mt-6">
        <View className="flex-row items-center gap-2 mb-3">
          <Text className="text-muted-fg text-xs uppercase tracking-wide">Billing</Text>
          <PaymentBadge status={request.paymentStatus ?? 'unpaid'} />
          {request.paymentMethod ? <Badge label={request.paymentMethod.toUpperCase()} tone="neutral" /> : null}
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
        ) : (
          <Text className="text-muted-fg text-sm">Not billed yet.</Text>
        )}
      </View>

      <View className="mx-5 mt-6">
        <Button label="Back to requests" variant="outline" fullWidth onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}