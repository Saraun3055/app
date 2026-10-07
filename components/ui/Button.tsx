import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary border border-primary',
  outline: 'bg-transparent border border-primary',
  ghost: 'bg-transparent border border-transparent',
  destructive: 'bg-destructive border border-destructive',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  outline: 'text-primary',
  ghost: 'text-primary',
  destructive: 'text-white',
};

const PADDING: Record<Size, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`rounded-md items-center justify-center ${PADDING[size]} ${CONTAINER[variant]} ${
        fullWidth ? 'w-full' : 'self-start'
      }`}
      style={({ pressed }) => [
        style as ViewStyle | ViewStyle[] | undefined,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <Text className={`font-sans ${LABEL[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});