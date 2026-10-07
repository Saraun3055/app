import React from 'react';
import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
};

export function Chip({ label, selected = false, onPress, className = '' }: Props) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full border mr-2 mb-2 ${
        selected ? 'border-primary bg-primary' : 'border-border'
      } ${className}`}
    >
      <Text className={`text-xs font-sans ${selected ? 'text-white' : 'text-muted-fg'}`}>{label}</Text>
    </Pressable>
  );
}