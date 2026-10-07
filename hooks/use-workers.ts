import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getAllWorkers,
  getWorkerProfile,
  getRatingsForWorker,
  nearbyWorkers,
  setWorkerAvailability,
  submitWorkerVerification,
  updateWorkerProfileApi,
} from '@/services/local-api';
import type { AvailabilitySlot, RatingDoc, WorkerProfileDoc } from '@/lib/types';

/** Workers near a point, ranked by rating by default. */
export function useNearbyWorkers(params: {
  lat: number;
  lng: number;
  radiusKm: number;
  category?: string | null;
  excludeIds?: string[];
  enabled?: boolean;
}) {
  const excludeIds = params.excludeIds ?? [];
  return useQuery({
    queryKey: ['nearbyWorkers', params.lat, params.lng, params.radiusKm, params.category ?? 'all', excludeIds],
    queryFn: () =>
      nearbyWorkers({
        lat: params.lat,
        lng: params.lng,
        radiusKm: params.radiusKm,
        category: params.category ?? null,
        excludeIds,
      }),
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });
}

export function useAllWorkers() {
  return useQuery({ queryKey: ['allWorkers'], queryFn: getAllWorkers, staleTime: 30_000 });
}

export function useWorkerProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['workerProfile', userId],
    queryFn: () => getWorkerProfile(userId as string),
    enabled: !!userId,
  });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isOnline }: { userId: string; isOnline: boolean }) => setWorkerAvailability(userId, isOnline),
    onSuccess: (profile) => {
      void qc.invalidateQueries({ queryKey: ['workerProfile'] });
      void qc.invalidateQueries({ queryKey: ['nearbyWorkers'] });
      void qc.invalidateQueries({ queryKey: ['allWorkers'] });
      return profile;
    },
  });
}

export function useUpdateWorkerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      categorySkills,
      availableSlots,
      address,
      pincode,
      area,
      bio,
    }: {
      userId: string;
      categorySkills: string[];
      availableSlots: AvailabilitySlot[];
      address?: string;
      pincode?: string;
      area?: string;
      bio?: string;
    }) => updateWorkerProfileApi(userId, { categorySkills, availableSlots, address, pincode, area, bio }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workerProfile'] });
      void qc.invalidateQueries({ queryKey: ['nearbyWorkers'] });
    },
  });
}

export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, govIdUrl, name }: { userId: string; govIdUrl: string; name?: string }) =>
      submitWorkerVerification(userId, govIdUrl, name),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workerProfile'] });
      void qc.invalidateQueries({ queryKey: ['verificationQueue'] });
    },
  });
}

export function useWorkerRatings(workerId: string | null | undefined) {
  return useQuery({
    queryKey: ['workerRatings', workerId],
    queryFn: () => getRatingsForWorker(workerId as string),
    enabled: !!workerId,
  });
}

export type { AvailabilitySlot, RatingDoc, WorkerProfileDoc };