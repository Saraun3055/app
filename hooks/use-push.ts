import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';

import { ensureNotificationsReady, loadNotifications } from '@/lib/notifications';
import { registerPushToken } from '@/services/push';
import { useAuthStore } from '@/stores/auth';

type ExtraEas = { eas?: { projectId?: string } };

async function pushTokenAsync(notifications: NonNullable<Awaited<ReturnType<typeof loadNotifications>>>): Promise<string | null> {
  const projectId =
    (Constants.expoConfig?.extra as ExtraEas | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) return null;
  const { data } = await notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

export function usePushRegistration(): void {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const lastUid = useRef<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (lastUid.current === user.uid) return;
      lastUid.current = user.uid;

      void (async () => {
        try {
          const allowed = await ensureNotificationsReady();
          if (!allowed) return;
          const Notifications = await loadNotifications();
          if (!Notifications) return;
          const token = await pushTokenAsync(Notifications);
          if (!token) return;
          await registerPushToken(token);
        } catch {
          lastUid.current = null;
        }
      })();
      return;
    }

    if (status === 'unauthenticated' && lastUid.current) {
      lastUid.current = null;
      void registerPushToken(null).catch(() => undefined);
    }
  }, [status, user]);
}
