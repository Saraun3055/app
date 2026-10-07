/**
 * Mobile data-source configuration.
 *
 * The app talks to the same Express + MongoDB Atlas backend as the web app.
 * Demo mode mirrors the web fallback so every screen can be exercised without
 * a live server.
 */
export type DataMode = 'demo' | 'local-api'

/**
 * Android emulators reach the host machine through 10.0.2.2 — point this at
 * your machine's LAN IP (or tunnel URL) for physical devices.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:4000'

export function resolveDataMode(): DataMode {
  return process.env.EXPO_PUBLIC_DATA_MODE === 'demo' ? 'demo' : 'local-api'
}

export const dataMode: DataMode = resolveDataMode()

export const isDemo = dataMode === 'demo'
export const isLocalApi = dataMode === 'local-api'