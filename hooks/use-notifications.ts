import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { notifyLocal } from '@/lib/notifications';

/**
 * Fires a local notification when a polled value changes while the app is in the
 * background. Polling already keeps the UI fresh in the foreground, so this only
 * needs to run off-screen.
 */
export function useBackgroundChangeNotification<T>(
  value: T | undefined,
  isEqual: (a: T, b: T) => boolean,
  build: (next: T) => { title: string; body: string; url?: string } | null,
): void {
  const previous = useRef<T | undefined>(undefined);
  const initialised = useRef(false);

  useEffect(() => {
    if (value === undefined) return;

    if (!initialised.current) {
      initialised.current = true;
      previous.current = value;
      return;
    }

    const before = previous.current;
    previous.current = value;

    if (before === undefined || isEqual(before, value)) return;

    const appState = AppState.currentState;
    if (appState === 'active') return;

    const payload = build(value);
    if (payload) void notifyLocal(payload.title, payload.body, payload.url);
  }, [value, isEqual, build]);
}
