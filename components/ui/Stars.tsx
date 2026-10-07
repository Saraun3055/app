import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { colors } from '@/constants/theme';

type StarsProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  showValue?: boolean;
  count?: number;
};

export function Stars({ value, onChange, size = 16, showValue = false, count }: StarsProps) {
  const rounded = Math.round(value * 2) / 2;

  return (
    <View className="flex-row items-center">
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rounded >= star;
          const icon = (
            <Star
              key={star}
              size={size}
              color={filled ? colors.accent : colors.mutedFg}
              fill={filled ? colors.accent : 'transparent'}
            />
          );
          if (!onChange) return icon;
          return (
            <Pressable key={star} onPress={() => onChange(star)} hitSlop={6} accessibilityRole="button">
              {icon}
            </Pressable>
          );
        })}
      </View>
      {showValue ? (
        <Text className="text-muted-fg text-xs ml-2 font-mono">
          {value.toFixed(1)}
          {typeof count === 'number' ? ` (${count})` : ''}
        </Text>
      ) : null}
    </View>
  );
}