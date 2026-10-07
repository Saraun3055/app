import React from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';

type Props = {
  /** Digits only, with or without a leading country code. */
  phone: string;
  name?: string;
  requestTitle?: string;
};

/** Opens the `wa.me` handoff — identical to the web app. */
export function whatsappUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function buildMessage(name: string | undefined, requestTitle: string | undefined): string {
  const who = name ? `Hi ${name},` : 'Hi,';
  const about = requestTitle ? ` regarding your GeoFix job "${requestTitle}"` : ' regarding your GeoFix job';
  return `${who} this is a GeoFix customer${about}.`;
}

export function WhatsAppHandoff({ phone, name, requestTitle }: Props) {
  const message = buildMessage(name, requestTitle);

  const open = async () => {
    const url = whatsappUrl(phone, message);
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('WhatsApp unavailable', 'Install WhatsApp to contact your worker directly.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open WhatsApp', 'Please try again in a moment.');
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={open}
      className="flex-row items-center justify-center border border-primary rounded-md py-3"
    >
      <MessageCircle size={16} color="#7A1B1C" />
      <Text className="text-primary font-sans ml-2">Connect on WhatsApp</Text>
    </Pressable>
  );
}

export function WhatsAppRow({ phone }: { phone: string }) {
  return (
    <View className="flex-row items-center">
      <Text className="text-muted-fg text-xs">Contact</Text>
      <Text className="text-foreground text-xs font-mono ml-2">{phone}</Text>
    </View>
  );
}