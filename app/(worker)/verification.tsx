import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSubmitVerification, useWorkerProfile } from '@/hooks/use-workers';
import { readAsDataUrl } from '@/lib/storage';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';

export default function WorkerVerification() {
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useWorkerProfile(user?.uid);
  const submit = useSubmitVerification();

  const [govId, setGovId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const status = profile?.verificationStatus ?? 'pending';
  const existing = profile?.govIdUrl;

  const pick = async (from: 'camera' | 'library') => {
    setPicking(true);
    try {
      const permission =
        from === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          from === 'camera'
            ? 'Allow camera access in Settings to photograph your ID.'
            : 'Allow photo access in Settings to pick an image of your ID.',
        );
        return;
      }

      const result =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });

      if (result.canceled || !result.assets?.length) return;

      const dataUrl = await readAsDataUrl(result.assets[0].uri);
      setGovId(dataUrl);
    } catch (e: any) {
      Alert.alert('Could not open picker', e?.message ?? 'Please try again.');
    } finally {
      setPicking(false);
    }
  };

  const onSubmit = async () => {
    if (!govId) {
      Alert.alert('Add your ID photo', 'Photograph your government ID so we can verify you.');
      return;
    }
    try {
      const ok = await submit.mutateAsync({
        userId: user?.uid ?? '',
        govIdUrl: govId,
        name: user?.name,
      });
      if (ok) {
        Alert.alert('Submitted for review', 'Our team usually reviews within 24 hours.');
        setGovId(null);
      } else {
        Alert.alert('Could not submit', 'Please try again in a moment.');
      }
    } catch (e: any) {
      Alert.alert('Could not submit', e?.message ?? 'Please try again in a moment.');
    }
  };

  const preview = govId ?? existing;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-14 pb-3">
        <Text className="font-display text-2xl text-primary">Verification</Text>
        <Text className="text-muted-fg text-xs mt-1">
          Only verified workers appear to customers in your area.
        </Text>
      </View>

      <View className="px-5">
        <View className="flex-row items-center gap-2 mb-4">
          <VerificationBadge status={status} />
          {isLoading ? <Text className="text-muted-fg text-xs">Loading…</Text> : null}
        </View>

        {status === 'approved' ? (
          <EmptyState
            title="You are verified"
            body="Your ID was approved. You can go online and start receiving jobs from customers near you."
          />
        ) : (
          <>
            {preview ? (
              <Image
                source={{ uri: preview }}
                style={{ width: '100%', height: 200, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View className="border border-dashed border-border rounded-lg h-40 items-center justify-center px-6">
                <Text className="text-muted-fg text-sm text-center">
                  Upload a clear photo of your Aadhaar, PAN, driving licence, or passport.
                </Text>
              </View>
            )}

            <Text className="text-muted-fg text-xs mt-3">
              Make sure all four corners are visible, the text is readable, and there is no glare.
            </Text>

            {status === 'rejected' ? (
              <View className="mt-4 border border-destructive rounded-lg p-3">
                <Text className="text-destructive text-xs font-sans">
                  Your last submission was rejected. Re-upload a clearer photo of the same valid ID.
                </Text>
              </View>
            ) : null}

            <View className="flex-row mt-5">
              <View className="flex-1 mr-2">
                <Button
                  label="Camera"
                  fullWidth
                  variant="outline"
                  loading={picking}
                  onPress={() => pick('camera')}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Gallery"
                  fullWidth
                  variant="outline"
                  loading={picking}
                  onPress={() => pick('library')}
                />
              </View>
            </View>

            <Button
              label={status === 'rejected' ? 'Re-submit for review' : 'Submit for review'}
              fullWidth
              loading={submit.isPending}
              disabled={!govId}
              onPress={onSubmit}
              className="mt-4"
            />

            {status === 'pending' && existing ? (
              <View className="mt-5">
                <Badge label="Under review since your last submission" tone="warning" />
              </View>
            ) : null}
          </>
        )}

        <View className="mt-8 border border-border rounded-lg p-4">
          <Text className="text-foreground font-sans mb-1">Why we verify</Text>
          <Text className="text-muted-fg text-xs">
            Customer trust is the whole product. Verified workers get rated higher, get more jobs, and build a
            reputation that follows them across categories.
          </Text>
          <Text className="text-muted-fg text-xs mt-3" style={{ color: colors.mutedFg }}>
            Your ID photo is visible only to the GeoFix operations team.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}