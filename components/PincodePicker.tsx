import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Input } from '@/components/ui/Input';
import {
  popularMaduraiLocations,
  searchMaduraiLocations,
  type MaduraiLocation,
} from '@/lib/madurai-locations';
import { colors } from '@/constants/theme';

type PincodePickerProps = {
  value?: string | null;
  label?: string;
  onSelect: (location: MaduraiLocation) => void;
};

export function PincodePicker({ value, label = 'Area / pincode', onSelect }: PincodePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const results = useMemo(
    () => (trimmed ? searchMaduraiLocations(trimmed, 20) : popularMaduraiLocations(12)),
    [trimmed],
  );
  const digits = trimmed.replace(/\D+/g, '');
  const outsideCoverage = digits.length >= 4 && results.length === 0;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className="border border-border rounded-md px-4 py-3 bg-background mb-4"
      >
        <Text className="text-muted-fg text-xs mb-1">{label}</Text>
        <Text className={value ? 'text-foreground font-sans' : 'text-muted-fg font-sans'}>
          {value ? formatPincode(value) : 'Search your area or pincode'}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-foreground/40">
          <View className="flex-1 mt-16 bg-background rounded-t-2xl">
            <View className="p-4 border-b border-border">
              <View className="w-10 h-1 rounded-full bg-muted self-center mb-3" />
              <Text className="font-display text-lg text-primary mb-3">Choose your area</Text>
              <Input
                placeholder="Search area or 6-digit pincode"
                placeholderTextColor={colors.mutedFg}
                value={query}
                onChangeText={setQuery}
                keyboardType="default"
                autoFocus
              />
              <Text className="text-muted-fg text-xs mt-1">Madurai region pincodes (625xxx) only</Text>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
              {results.length === 0 ? (
                <View className="p-6">
                  <Text className="text-foreground font-sans text-center mb-1">
                    {outsideCoverage ? `No coverage for ${digits}` : 'No matching areas'}
                  </Text>
                  <Text className="text-muted-fg text-xs text-center">
                    {outsideCoverage
                      ? 'We only serve Madurai district pincodes (625001–625708). Try a nearby 625xxx pincode or your area name.'
                      : 'Try a different spelling, or a 625xxx pincode.'}
                  </Text>
                </View>
              ) : (
                <>
                  {!trimmed ? (
                    <Text className="text-muted-fg text-xs uppercase tracking-wide px-5 pt-3 pb-1">
                      Popular areas
                    </Text>
                  ) : null}
                  {results.map((loc) => (
                    <Pressable
                      key={`${loc.pincode}-${loc.name}`}
                      accessibilityRole="button"
                      onPress={() => {
                        onSelect(loc);
                        setOpen(false);
                        setQuery('');
                      }}
                      className="px-5 py-4 border-b border-border"
                    >
                      <Text className="text-foreground font-sans">{loc.name}</Text>
                      <Text className="text-muted-fg text-xs font-mono mt-0.5">{loc.pincode}</Text>
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function formatPincode(pincode: string): string {
  return pincode.startsWith('625') ? `Pincode ${pincode}` : pincode;
}