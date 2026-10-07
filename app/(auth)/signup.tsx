import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Link } from 'expo-router';

import { useAuthStore } from '@/stores/auth';
import type { SignupInput } from '@/stores/auth';
import { CATEGORY_LIST } from '@/lib/types';

const ROLES: SignupInput['role'][] = ['customer', 'worker'];

const ROLE_BLURB: Record<SignupInput['role'], string> = {
  customer: 'Book verified repair workers',
  worker: 'Receive repair jobs nearby',
};

export default function Signup() {
  const signup = useAuthStore((s) => s.signup);
  const [form, setForm] = useState<SignupInput>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof SignupInput) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const toggleSkill = (skill: string) =>
    setForm((f) => {
      const current = f.categorySkills ?? [];
      const next = current.includes(skill)
        ? current.filter((s) => s !== skill)
        : [...current, skill];
      return { ...f, categorySkills: next };
    });

  const onSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Missing details', 'Name, email and password are required.');
      return;
    }
    // The API rejects worker signups without at least one skill.
    if (form.role === 'worker' && !(form.categorySkills ?? []).length) {
      Alert.alert('Pick your skills', 'Select at least one skill you work on.');
      return;
    }
    try {
      setLoading(true);
      await signup({ ...form, name: form.name.trim(), email: form.email.trim() });
    } catch (e: any) {
      Alert.alert('Signup failed', e?.message ?? 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-6 pt-16 pb-10">
      <Text className="font-display text-3xl text-primary mb-8">Create Account</Text>

      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-4"
        placeholder="Full name"
        placeholderTextColor="#786061"
        value={form.name}
        onChangeText={set('name')}
      />
      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-4"
        placeholder="Email"
        placeholderTextColor="#786061"
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={set('email')}
      />
      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-4"
        placeholder="Phone"
        placeholderTextColor="#786061"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={set('phone')}
      />
      <TextInput
        className="border border-border rounded-md px-4 py-3 mb-6"
        placeholder="Password"
        placeholderTextColor="#786061"
        secureTextEntry
        value={form.password}
        onChangeText={set('password')}
      />

      <Text className="text-foreground mb-2 font-sans">I am joining as</Text>
      <View className="flex-row gap-3 mb-2">
        {ROLES.map((role) => {
          const active = form.role === role;
          return (
            <TouchableOpacity
              key={role}
              onPress={() => setForm((f) => ({ ...f, role }))}
              className={
                active
                  ? 'flex-1 rounded-md border border-primary bg-primary px-3 py-3'
                  : 'flex-1 rounded-md border border-border px-3 py-3'
              }
            >
              <Text className={active ? 'text-white font-sans capitalize' : 'text-foreground font-sans capitalize'}>
                {role}
              </Text>
              <Text className={active ? 'text-secondary text-xs' : 'text-muted-fg text-xs'}>
                {ROLE_BLURB[role]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {form.role === 'worker' ? (
        <View className="mt-6 mb-2">
          <Text className="text-foreground mb-1 font-sans">What do you work on?</Text>
          <Text className="text-muted-fg text-xs mb-3">Pick every trade you can take jobs for.</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORY_LIST.map((skill) => {
              const active = (form.categorySkills ?? []).includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  className={
                    active
                      ? 'rounded-full border border-primary bg-primary px-3 py-2'
                      : 'rounded-full border border-border px-3 py-2'
                  }
                >
                  <Text className={active ? 'text-white font-sans text-sm' : 'text-foreground font-sans text-sm'}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        className="bg-primary rounded-md py-3 items-center mt-6"
        onPress={onSubmit}
        disabled={loading}
      >
        <Text className="text-white font-sans">{loading ? 'Creating account...' : 'Sign up'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" className="text-muted-fg text-center mt-6">
        Already have an account? Login
      </Link>
    </ScrollView>
  );
}