import React from 'react';
import { router, Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import type { Notification } from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from '@expo-google-fonts/archivo';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import '../global.css';
import { useAuthStore } from '@/stores/auth';
import { useAuthInit } from '@/hooks/use-auth';
import { loadNotifications } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 2_000,
    },
  },
});

/** Deep-links into the screen a local notification was raised from. */
function useNotificationTapRedirect() {
  React.useEffect(() => {
    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    const redirect = (notification: Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };

    // Lazy on purpose: expo-notifications is unavailable in Expo Go.
    void loadNotifications().then((Notifications) => {
      if (!Notifications || cancelled) return;

      const last = Notifications.getLastNotificationResponse();
      if (last?.notification) redirect(last.notification);

      subscription = Notifications.addNotificationResponseReceivedListener((response) =>
        redirect(response.notification),
      );
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const status = useAuthStore((s) => s.status);
  useAuthInit();

  React.useEffect(() => {
    void init();
  }, [init]);

  React.useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [status]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useNotificationTapRedirect();

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthGate>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGate>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}