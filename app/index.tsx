import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/stores/auth';

/**
 * Entry splash. The auth guard in `useAuthInit` owns the redirect, so this
 * screen only renders while the JWT is being restored from secure-store.
 */
export default function Index() {
  const status = useAuthStore((s) => s.status);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      {status === 'loading' ? <ActivityIndicator size="large" color="#7A1B1C" /> : null}
    </View>
  );
}