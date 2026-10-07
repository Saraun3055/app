import { create } from 'zustand';

import { isLocalApi } from '@/lib/mode';
import { persistAccessToken } from '@/lib/api-client';
import { getToken, removeToken } from '@/lib/storage';
import { apiLogin, apiMe, apiSignup } from '@/services/local-api';
import type { UserDoc } from '@/lib/types';

export type AuthUser = Pick<UserDoc, 'uid' | 'name' | 'role' | 'adminRole'> & {
  email?: string;
  phone?: string;
  pincode?: string;
  area?: string;
};

export type SignupInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'worker';
  categorySkills?: string[];
};

export type AuthState = {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  /** Restores a persisted JWT from secure-store on cold start. */
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (input: SignupInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  applyProfile: (updates: { name?: string; phone?: string; pincode?: string; area?: string }) => void;
};

function toAuthUser(doc: UserDoc): AuthUser {
  return {
    uid: doc.uid,
    name: doc.name,
    role: doc.role,
    adminRole: doc.adminRole,
    email: doc.email,
    phone: doc.phone,
    pincode: doc.pincode,
    area: doc.area,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  init: async () => {
    if (!isLocalApi) {
      set({ status: 'unauthenticated' });
      return;
    }
    const token = await getToken();
    if (!token) {
      set({ status: 'unauthenticated' });
      return;
    }
    try {
      const me = await apiMe();
      if (me) set({ user: toAuthUser(me), status: 'authenticated' });
      else {
        await removeToken();
        set({ status: 'unauthenticated' });
      }
    } catch {
      set({ status: 'unauthenticated' });
    }
  },

  login: async (email, password) => {
    const { accessToken, user } = await apiLogin(email, password);
    await persistAccessToken(accessToken);
    const authUser = toAuthUser(user);
    set({ user: authUser, status: 'authenticated' });
    return authUser;
  },

  signup: async (input) => {
    const { accessToken, user } = await apiSignup(input);
    await persistAccessToken(accessToken);
    const authUser = toAuthUser(user);
    set({ user: authUser, status: 'authenticated' });
    return authUser;
  },

  logout: async () => {
    await removeToken();
    set({ user: null, status: 'unauthenticated' });
  },

  applyProfile: (updates) =>
    set((s) => (s.user ? { user: { ...s.user, ...updates } } : s)),
}));