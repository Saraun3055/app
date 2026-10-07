import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'geofix_access_token';

/* ──────────── JWT in the encrypted keychain ──────────── */

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* nothing stored */
  }
}

/* ──────────── Photo uploads ──────────── */

/**
 * The backend has no cloud storage yet, so photos are inlined as data URLs —
 * the same contract the web app uses.
 */
export async function uploadPhoto(uri: string): Promise<string> {
  return readAsDataUrl(uri);
}

export async function readAsDataUrl(uri: string): Promise<string> {
  const FileSystem = await import('expo-file-system/legacy');
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const extension = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const mime = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

export async function uploadPhotos(uris: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of uris) {
    urls.push(await uploadPhoto(uri));
  }
  return urls;
}