import { API_BASE_URL } from './mode';
import { getToken, removeToken, setToken } from './storage';

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * Lets the auth store react to expired sessions without this module importing it,
 * which would create a require cycle (stores/auth -> lib/api-client -> stores/auth)
 * and could leave `useAuthStore` uninitialised at module-evaluation time.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/**
 * Minimal fetch wrapper for the local Express API.
 * - Reads the JWT from expo-secure-store on every request.
 * - Clears the stored token on 401 so the auth guard can redirect.
 * - Resolves JSON (or undefined on 204) and throws `ApiError` on failures.
 */
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type RequestOverrides = Omit<RequestInit, 'body' | 'method'>;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401 && token) {
    await removeToken();
    onUnauthorized?.();
  }

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    let errors: Record<string, string> | undefined;
    try {
      const body = (await res.json()) as { message?: string; errors?: Record<string, string> };
      if (body?.message) message = body.message;
      if (body?.errors) errors = body.errors;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status, errors);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOverrides) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOverrides) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown, options?: RequestOverrides) =>
    request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string, options?: RequestOverrides) => request<T>(path, { ...options, method: 'DELETE' }),
};

/** Persist a freshly issued JWT in the encrypted keychain. */
export async function persistAccessToken(token: string): Promise<void> {
  await setToken(token);
}