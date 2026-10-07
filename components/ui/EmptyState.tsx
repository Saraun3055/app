import React from 'react';
import { Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';

import { colors } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  body?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-4">
        <Inbox size={26} color={colors.primary} />
      </View>
      <Text className="font-display text-lg text-primary text-center">{title}</Text>
      {body ? <Text className="text-muted-fg text-center mt-2">{body}</Text> : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}