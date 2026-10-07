import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ImagePlus, X } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PincodePicker } from '@/components/PincodePicker';
import { CategoryGrid } from '@/components/CategoryIcon';
import { colors } from '@/constants/theme';
import { useCreateRequest } from '@/hooks/use-requests';
import { MADURAI_CENTER, type MaduraiLocation } from '@/lib/madurai-locations';
import { CATEGORY_LIST, SUBCATEGORIES_MAP, type ServiceCategory } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';
import { useGeo } from '@/hooks/use-geo';
import { uploadPhotos } from '@/lib/storage';

const MAX_PHOTOS = 4;

export default function NewRequest() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const user = useAuthStore((s) => s.user);
  const { coords } = useGeo();
  const create = useCreateRequest();

  const initialCategory = (CATEGORY_LIST as readonly string[]).includes(params.category ?? '')
    ? (params.category as ServiceCategory)
    : 'Plumbing';

  const [category, setCategory] = useState<ServiceCategory>(initialCategory);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<MaduraiLocation | null>(null);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const pickPhoto = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to attach photos of the problem.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, selectionLimit: MAX_PHOTOS - photos.length });

    if (result.canceled) return;

    const uris = result.assets.map((asset) => asset.uri);
    setPhotos((prev) => [...prev, ...uris].slice(0, MAX_PHOTOS));
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'Tell workers what is broken in a few words.');
      return;
    }
    try {
      setSaving(true);
      const photoUrls = photos.length ? await uploadPhotos(photos) : [];
      const point = coords ?? {
        latitude: location?.lat ?? MADURAI_CENTER.lat,
        longitude: location?.lng ?? MADURAI_CENTER.lng,
      };

      const created = await create.mutateAsync({
        customerName: user?.name ?? 'Customer',
        category,
        title: title.trim(),
        description: description.trim(),
        photoUrls,
        location: point,
        address: address.trim() || undefined,
        pincode: location?.pincode,
        area: location?.name,
        whatsappNumber: user?.phone,
      });

      router.push({ pathname: '/new/workers', params: { requestId: created } });
    } catch (e: any) {
      Alert.alert('Could not create request', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const subcategories = SUBCATEGORIES_MAP[category] ?? [];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-14 pb-4">
        <Text className="font-display text-2xl text-primary">What needs fixing?</Text>
      </View>

      <View className="px-5">
        <Text className="text-foreground font-sans mb-3">Category</Text>
        <CategoryGrid onSelect={setCategory} />
      </View>

      {subcategories.length ? (
        <View className="px-5 mt-4">
          <Text className="text-foreground font-sans mb-2">Common issues</Text>
          <View className="flex-row flex-wrap gap-2">
            {subcategories.map((issue) => (
              <Pressable
                key={issue}
                accessibilityRole="button"
                onPress={() => setTitle(issue)}
                className="bg-secondary border border-border rounded-full px-3 py-2"
              >
                <Text className="text-primary text-xs font-sans">{issue}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View className="px-5 mt-6">
        <Input
          label="Short title"
          placeholder="e.g. Kitchen sink is leaking"
          placeholderTextColor={colors.mutedFg}
          value={title}
          onChangeText={setTitle}
        />
        <Input
          label="Details (optional)"
          placeholder="Anything that helps the worker arrive prepared"
          placeholderTextColor={colors.mutedFg}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text className="text-foreground font-sans mb-2">Photos (optional)</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {photos.map((uri, i) => (
            <View key={uri} className="relative">
              <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 12 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary items-center justify-center"
              >
                <X size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}

          {photos.length < MAX_PHOTOS ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => pickPhoto('camera')}
                className="w-[72px] h-[72px] rounded-lg border border-border items-center justify-center bg-muted"
              >
                <Camera size={18} color="#7A1B1C" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => pickPhoto('library')}
                className="w-[72px] h-[72px] rounded-lg border border-border items-center justify-center bg-muted"
              >
                <ImagePlus size={18} color="#7A1B1C" />
              </Pressable>
            </>
          ) : null}
        </View>

        <PincodePicker
          value={location ? `${location.pincode}` : null}
          label="Where do you need help?"
          onSelect={setLocation}
        />
        <Input
          label="Street address"
          placeholder="Door number, street, landmark"
          placeholderTextColor={colors.mutedFg}
          value={address}
          onChangeText={setAddress}
        />

        <Button
          label="Find workers"
          fullWidth
          loading={saving}
          onPress={submit}
          className="mt-2"
        />
        <Text className="text-muted-fg text-xs mt-3 text-center">
          Only verified workers covering your pincode will be notified.
        </Text>
      </View>
    </ScrollView>
  );
}