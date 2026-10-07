import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getActiveStats,
  getAllApiUsers,
  getAuditLog,
  getDisputes,
  getRatingDistribution,
  getVerificationQueue,
  resolveApiDispute,
  reviewVerification,
  setUserSuspended,
} from '@/services/local-api';
import type { AuditLogDoc, DisputeStatus, UserDoc, VerificationQueueStatus } from '@/lib/types';

const ADMIN_POLL_MS = 10_000;

export function useVerificationQueue(status: VerificationQueueStatus | 'all' = 'pending') {
  return useQuery({
    queryKey: ['verificationQueue', status],
    queryFn: () => getVerificationQueue(status),
    refetchInterval: ADMIN_POLL_MS,
  });
}

export function useReviewVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, status }: { workerId: string; status: 'approved' | 'rejected' }) =>
      reviewVerification(workerId, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['verificationQueue'] });
      void qc.invalidateQueries({ queryKey: ['allWorkers'] });
    },
  });
}

export function useDisputes(status: DisputeStatus | '' = '') {
  return useQuery({
    queryKey: ['disputes', status],
    queryFn: () => getDisputes(status),
    refetchInterval: ADMIN_POLL_MS,
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, resolutionNote }: { disputeId: string; resolutionNote: string }) =>
      resolveApiDispute(disputeId, resolutionNote),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

export function useAuditLog() {
  return useQuery({ queryKey: ['auditLog'], queryFn: getAuditLog, staleTime: 30_000 });
}

export function useAdminUsers() {
  return useQuery({ queryKey: ['adminUsers'], queryFn: getAllApiUsers, staleTime: 30_000 });
}

export function useSetUserSuspended() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, suspended }: { uid: string; suspended: boolean }) => setUserSuspended(uid, suspended),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useActiveStats() {
  return useQuery({ queryKey: ['activeStats'], queryFn: getActiveStats, refetchInterval: LIVE_ADMIN_POLL_MS });
}

export function useRatingDistribution() {
  return useQuery({ queryKey: ['ratingDistribution'], queryFn: getRatingDistribution, staleTime: 60_000 });
}

const LIVE_ADMIN_POLL_MS = ADMIN_POLL_MS;

export type { AuditLogDoc, UserDoc };