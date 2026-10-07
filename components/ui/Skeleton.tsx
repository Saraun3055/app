import React, { useEffect, useState } from 'react';
import { Animated, View, type ViewProps } from 'react-native';

type SkeletonProps = ViewProps & {
  width?: number | `${number}%`;
  height?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
};

const RADIUS = { sm: 6, md: 12, lg: 14, full: 999 } as const;

export function Skeleton({ width = '100%', height = 16, rounded = 'md', style, ...rest }: SkeletonProps) {
  const [pulse] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[{ opacity: pulse, width, height, borderRadius: RADIUS[rounded], backgroundColor: '#FAF4F4' }, style]}
      {...rest}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <View className="border border-border rounded-lg p-4 bg-background mb-3">
      <Skeleton width="60%" height={18} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '40%' : '90%'} height={12} rounded="sm" style={{ marginTop: 10 }} />
      ))}
    </View>
  );
}