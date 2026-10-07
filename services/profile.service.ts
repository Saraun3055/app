import { updateMyProfileApi } from '@/services/local-api';
import { useAuthStore } from '@/stores/auth';

export type ProfileEdits = { name?: string; phone?: string; pincode?: string; area?: string };

/** Update the signed-in user's display name / phone / home area. */
export async function updateMyProfile(data: ProfileEdits): Promise<boolean> {
  const user = await updateMyProfileApi(data);
  if (!user) return false;

  useAuthStore.getState().applyProfile({
    name: user.name,
    phone: user.phone ?? '',
    pincode: user.pincode ?? '',
    area: user.area ?? '',
  });

  return true;
}