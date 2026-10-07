import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type * as NotificationTypes from 'expo-notifications';

import { colors } from '@/constants/theme';

const CHANNEL_ID = 'geofix-activity';

type NotificationsModule = typeof NotificationTypes;

let modulePromise: Promise<NotificationsModule | null> | null = null;

/**
 * On Android, `expo-notifications` throws while evaluating inside Expo Go because
 * remote push was removed from Expo Go in SDK 53. That throw escapes Metro's
 * module loader, so it red-screens the app no matter how it is imported. Skip
 * loading it there entirely; real builds are unaffected. `expoGoConfig` is only
 * ever defined in the Expo Go client.
 */
function unsupportedInExpoGo(): boolean {
  return Platform.OS === 'android' && Boolean(Constants.expoGoConfig);
}

/**
 * Loads `expo-notifications` lazily. Resolves to `null` whenever notifications
 * are unavailable, so every caller can degrade gracefully instead of crashing.
 */
export function loadNotifications(): Promise<NotificationsModule | null> {
  if (!modulePromise) {
    modulePromise = (async () => {
      if (unsupportedInExpoGo()) return null;

      const mod = await import('expo-notifications');
      // Registered as early as possible so foreground notifications render.
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      return mod as NotificationsModule;
    })().catch(() => null);
  }

  return modulePromise;
}

let configured: Promise<boolean> | null = null;

/** Idempotently creates the Android channel and asks for permission. */
export function ensureNotificationsReady(): Promise<boolean> {
  if (!configured) {
    configured = (async () => {
      const Notifications = await loadNotifications();
      if (!Notifications) return false;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Job activity',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: colors.accent,
          sound: 'default',
        }).catch(() => undefined);
      }

      const existing = await Notifications.getPermissionsAsync();
      const granted =
        existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

      if (granted) return true;

      const requested = await Notifications.requestPermissionsAsync();
      return requested.granted;
    })().catch(() => false);
  }

  return configured;
}

/**
 * Fires an immediate local notification. `url` is carried in the payload so the
 * tap handler in the root layout can deep-link to the relevant screen.
 */
export async function notifyLocal(title: string, body: string, url?: string): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  const allowed = await ensureNotificationsReady();
  if (!allowed) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      color: colors.primary,
      data: url ? { url } : undefined,
    },
    trigger:
      Platform.OS === 'android'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
            channelId: CHANNEL_ID,
          }
        : null,
  }).catch(() => undefined);
}
