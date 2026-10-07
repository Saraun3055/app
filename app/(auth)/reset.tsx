import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { resetPassword } from '@/services/local-api';

export default function Reset() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !code.trim() || !password) {
      Alert.alert('Missing details', 'Email, reset code and new password are all required.');
      return;
    }
    try {
      setLoading(true);
      const res = await resetPassword({ email: email.trim(), code: code.trim(), password });
      Alert.alert('Password updated', res.message, [{ text: 'Login', onPress: () => router.replace('/(auth)/login') }]);
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Could not reset your password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background justify-center px-6">
      <Text className="font-display text-2xl text-primary mb-8">Reset password</Text>

      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-4"
        placeholder="Email"
        placeholderTextColor="#786061"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-4"
        placeholder="Reset code"
        placeholderTextColor="#786061"
        value={code}
        onChangeText={setCode}
      />
      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-6"
        placeholder="New password"
        placeholderTextColor="#786061"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity className="bg-primary rounded-md py-3 items-center" onPress={onSubmit} disabled={loading}>
        <Text className="text-white font-sans">{loading ? 'Updating...' : 'Reset password'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" className="text-muted-fg text-center mt-6">
        Back to login
      </Link>
    </View>
  );
}