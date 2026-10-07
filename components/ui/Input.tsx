import React, { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/constants/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, className = '', multiline, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-4">
      {label ? <Text className="text-foreground font-sans mb-1">{label}</Text> : null}
      <TextInput
        multiline={multiline}
        placeholderTextColor={colors.mutedFg}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={[
          'border rounded-md px-4 py-3 bg-background text-foreground font-sans',
          focused ? 'border-primary' : 'border-border',
          multiline ? 'min-h-[96px]' : '',
          error ? 'border-destructive' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {error ? <Text className="text-destructive text-xs mt-1">{error}</Text> : null}
      {!error && hint ? <Text className="text-muted-fg text-xs mt-1">{hint}</Text> : null}
    </View>
  );
}