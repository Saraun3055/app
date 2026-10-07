import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { requestPasswordReset } from '@/services/local-api';

export default function Forgot() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email you signed up with.');
      return;
    }
    try {
      setLoading(true);
      const res = await requestPasswordReset(email.trim());
      Alert.alert('Reset code sent', res.devCode ? `Your code: ${res.devCode}` : res.message, [
        { text: 'Enter code', onPress: () => router.push('/(auth)/reset') },
      ]);
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Could not send a reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background justify-center px-6">
      <Text className="font-display text-2xl text-primary mb-2">Forgot password</Text>
      <Text className="text-muted-fg mb-8">We&apos;ll email you a reset code.</Text>

      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-6"
        placeholder="Email"
        placeholderTextColor="#786061"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity className="bg-primary rounded-md py-3 items-center" onPress={onSubmit} disabled={loading}>
        <Text className="text-white font-sans">{loading ? 'Sending...' : 'Send reset code'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" className="text-muted-fg text-center mt-6">
        Back to login
      </Link>
    </View>
  );
}