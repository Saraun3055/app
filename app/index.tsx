import { ActivityIndicator, Text, View } from 'react-native';
import { Wrench } from 'lucide-react-native';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <View
        className="w-24 h-24 rounded-3xl items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
      >
        <Wrench size={44} color="#FFFFFF" />
      </View>
      <Text className="font-display text-3xl font-bold text-white mb-2">GeoFix</Text>
      <Text className="font-sans text-sm text-white/80 mb-8">Madurai’s home services, on demand</Text>
      <ActivityIndicator size="small" color="#FFFFFF" />
    </View>
  );
}
