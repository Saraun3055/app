import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { StatusBadge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/CategoryIcon';
import type { ServiceRequestDoc } from '@/lib/types';

function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

type Props = {
  request: ServiceRequestDoc;
  onPress?: () => void;
  footer?: React.ReactNode;
};

export function RequestCard({ request, onPress, footer }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="border border-border rounded-lg p-4 bg-background mb-3"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <View className="flex-row items-center">
            <CategoryIcon category={request.category} size={14} />
            <Text className="text-muted-fg text-xs ml-1.5">{request.category}</Text>
          </View>
          <Text className="text-foreground font-sans mt-1">{request.title}</Text>
          {request.customerName ? (
            <Text className="text-muted-fg text-xs mt-0.5">{request.customerName}</Text>
          ) : null}
        </View>
        <StatusBadge status={request.status} />
      </View>

      {request.description ? (
        <Text className="text-muted-fg text-xs mt-2" numberOfLines={2}>
          {request.description}
        </Text>
      ) : null}

      {request.photoUrls?.length ? (
        <View className="flex-row gap-2 mt-3">
          {request.photoUrls.slice(0, 4).map((url, i) =>
            url.startsWith('data:') ? (
              <Image
                key={`${i}-${url.slice(-16)}`}
                source={{ uri: url }}
                style={{ width: 52, height: 52, borderRadius: 8 }}
              />
            ) : (
              <Image
                key={`${i}-${url}`}
                source={{ uri: url }}
                style={{ width: 52, height: 52, borderRadius: 8 }}
              />
            ),
          )}
        </View>
      ) : null}

      <View className="flex-row items-center mt-3">
        <Text className="text-muted-fg text-xs">{relativeTime(request.createdAt)}</Text>
        {request.customerArea || request.customerPincode ? (
          <Text className="text-muted-fg text-xs ml-3">
            {[request.customerArea, request.customerPincode].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>

      {footer ? <View className="mt-3">{footer}</View> : null}
    </Pressable>
  );
}