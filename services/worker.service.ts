import { uploadPhoto } from '@/lib/storage';
import { submitWorkerVerification } from '@/services/local-api';

/**
 * No cloud storage on the local API: encode the ID photo as a data URL (same
 * behaviour as the web app) and post it to the Express backend.
 */
export async function submitVerification(workerId: string, name: string, uri: string): Promise<boolean> {
  const url = await uploadPhoto(uri);
  return submitWorkerVerification(workerId, url, name);
}