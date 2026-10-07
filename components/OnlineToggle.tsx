import React, { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  pending?: boolean;
};

/**
 * Pill-style Online/Offline switch. Amber gradient when online, with radar
 * rings pulsing off the dot.
 */
export function OnlineToggle({ value, onChange, disabled, pending }: Props) {
  const [slide] = useState(() => new Animated.Value(value ? 1 : 0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [ringOne] = useState(() => new Animated.Value(0));
  const [ringTwo] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(slide, {
      toValue: value ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [value, slide]);

  useEffect(() => {
    if (!value) {
      pulse.stopAnimation();
      ringOne.stopAnimation();
      ringTwo.stopAnimation();
      return;
    }

    pulse.setValue(0);
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    ).start();

    for (const [ring, delay] of [
      [ringOne, 0],
      [ringTwo, 800],
    ] as const) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(ring, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();
    }

    return () => {
      pulse.stopAnimation();
      ringOne.stopAnimation();
      ringTwo.stopAnimation();
    };
  }, [value, pulse, ringOne, ringTwo]);

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [4, 52] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      className="self-start"
    >
      <View
        className={`h-14 w-[112px] rounded-full flex-row items-center px-1 ${
          value ? 'bg-accent' : 'bg-muted'
        }`}
      >
        <Animated.View
          style={{
            transform: [{ translateX }],
            width: 48,
            height: 48,
            borderRadius: 999,
            backgroundColor: value ? colors.accent : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: value ? '#FFFFFF' : colors.mutedFg }}
          />

          {[ringOne, ringTwo].map((ring, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: 12,
                height: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#FFFFFF',
                opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] }) }],
              }}
            />
          ))}
        </Animated.View>
      </View>

      <Text className={`mt-2 font-sans ${value ? 'text-accent' : 'text-muted-fg'}`}>
        {pending ? 'Updating...' : value ? 'Online — receiving jobs' : 'Offline'}
      </Text>
    </Pressable>
  );
}