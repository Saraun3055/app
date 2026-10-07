import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Brush,
  Droplets,
  Hammer,
  Lock,
  Paintbrush,
  Plug,
  Snowflake,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';

import { CATEGORY_LIST, type ServiceCategory } from '@/lib/types';

const ICONS: Record<ServiceCategory, LucideIcon> = {
  Plumbing: Droplets,
  Electrical: Plug,
  Carpentry: Hammer,
  Painting: Paintbrush,
  Appliance: Sparkles,
  Locksmith: Lock,
  'AC / HVAC': Snowflake,
  General: Brush,
};

export function CategoryIcon({ category, size = 18, color = '#7A1B1C' }: { category: string; size?: number; color?: string }) {
  const Icon = (CATEGORY_LIST as readonly string[]).includes(category)
    ? ICONS[category as ServiceCategory]
    : Sparkles;
  return <Icon size={size} color={color} />;
}

type CategoryGridProps = {
  onSelect: (category: ServiceCategory) => void;
  columns?: number;
};

export function CategoryGrid({ onSelect, columns = 4 }: CategoryGridProps) {
  return (
    <View className="flex-row flex-wrap -mx-1">
      {CATEGORY_LIST.map((category) => {
        const Icon = ICONS[category];
        return (
          <View key={category} style={{ width: `${100 / columns}%` }} className="px-1 mb-3">
            <Pressable
              onPress={() => onSelect(category)}
              accessibilityRole="button"
              className="border border-border rounded-lg bg-background px-2 py-4 items-center"
            >
              <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center mb-2">
                <Icon size={20} color="#7A1B1C" />
              </View>
              <Text className="text-xs text-foreground font-sans text-center" numberOfLines={2}>
                {category}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}