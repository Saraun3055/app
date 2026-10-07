import { api } from '@/lib/api-client';

export async function registerPushToken(token: string | null): Promise<void> {
  await api.post<void>('/users/me/push-token', { token });
}
