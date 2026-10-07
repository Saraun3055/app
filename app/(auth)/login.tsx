import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';

import { useAuthStore } from '@/stores/auth';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter both your email and password.');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert('Login failed', e?.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background justify-center px-6">
      <Text className="font-display text-3xl text-primary mb-1">GeoFix</Text>
      <Text className="text-muted-fg mb-8">Home repairs, sorted in Madurai</Text>

      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-4"
        placeholder="Email"
        placeholderTextColor="#786061"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-6"
        placeholder="Password"
        placeholderTextColor="#786061"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className="bg-primary rounded-md py-3 items-center"
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white font-sans">Login</Text>}
      </TouchableOpacity>

      <Link href="/(auth)/signup" className="text-muted-fg text-center mt-6">
        Don&apos;t have an account? Sign up
      </Link>
      <Link href="/(auth)/forgot" className="text-muted-fg text-center mt-2">
        Forgot password?
      </Link>
    </View>
  );
}