import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { useAuthStore } from '@/stores/auth';
import { setUnauthorizedHandler } from '@/lib/api-client';

const PORTAL_GROUPS = ['(customer)', '(worker)', '(admin)'] as const;

const HOME: Record<string, string> = {
  customer: '/(customer)/dashboard',
  worker: '/(worker)/dashboard',
  admin: '/(admin)/overview',
};

/**
 * Role-aware route guard. Blocks the portals until the persisted JWT has been
 * restored, then redirects to the matching portal (or back to login). Also
 * stops an authenticated user from wandering into another role's portal.
 */
export function useAuthInit() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const segments = useSegments();

  // The API client cannot import the store (that would be a require cycle), so
  // it is handed a callback here. Done in an effect rather than at module scope
  // so it cannot run before the store and client have both been initialised.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.setState({ user: null, status: 'unauthenticated' });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    const group = segments[0];

    if (status === 'unauthenticated') {
      if (group !== '(auth)') router.replace('/(auth)/login');
      return;
    }

    if (!user) return;

    const portal = user.role === 'admin' ? '(admin)' : user.role === 'worker' ? '(worker)' : '(customer)';
    const home = HOME[user.role] ?? HOME.customer;

    if (group === '(auth)') {
      router.replace(home);
      return;
    }

    if (PORTAL_GROUPS.includes(group as (typeof PORTAL_GROUPS)[number]) && group !== portal) {
      router.replace(home);
    }
  }, [status, user, segments, router]);
}