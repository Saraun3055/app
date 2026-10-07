import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  acceptApiRequest,
  assignWorker,
  cancelApiRequest,
  completeApiRequest,
  createApiRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  getWorkerIncoming,
  getWorkerJobs,
  payForApiRequest,
  raiseDispute,
  rateWorkerForRequest,
  rejectApiRequest,
  updateJobProgressApi,
} from '@/services/local-api';
import type { GeoPointLike, JobProgressStatus, RequestStatus, ServiceRequestDoc } from '@/lib/types';

/** Live poll interval for status screens, matching the web app. */
const LIVE_POLL_MS = 4_000;
const LIST_POLL_MS = 8_000;

export function useMyRequests(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ['myRequests', customerId],
    queryFn: () => getMyRequests(customerId as string),
    enabled: !!customerId,
    refetchInterval: LIST_POLL_MS,
  });
}

export function useWorkerIncoming(workerId: string | null | undefined) {
  return useQuery({
    queryKey: ['workerIncoming', workerId],
    queryFn: () => getWorkerIncoming(workerId as string),
    enabled: !!workerId,
    refetchInterval: LIVE_POLL_MS,
  });
}

export function useWorkerJobs(workerId: string | null | undefined) {
  return useQuery({
    queryKey: ['workerJobs', workerId],
    queryFn: () => getWorkerJobs(workerId as string),
    enabled: !!workerId,
    refetchInterval: LIVE_POLL_MS,
  });
}

/** Single-request feed for the live status timeline. */
export function useRequestLive(requestId: string | null | undefined) {
  return useQuery({
    queryKey: ['requestLive', requestId],
    queryFn: () => getRequestById(requestId as string),
    enabled: !!requestId,
    refetchInterval: LIVE_POLL_MS,
  });
}

export function useAllRequests(statusFilter?: RequestStatus) {
  return useQuery({
    queryKey: ['allRequests', statusFilter ?? 'all'],
    queryFn: () => getAllRequests(statusFilter),
    refetchInterval: 10_000,
  });
}

export type CreateRequestInput = {
  category: string;
  title: string;
  description: string;
  photoUrls: string[];
  location: GeoPointLike;
  customerName: string;
  address?: string;
  pincode?: string;
  area?: string;
  whatsappNumber?: string;
};

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRequestInput) =>
      createApiRequest(input.customerName, input.customerName, input).then((id) => id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['myRequests'] });
      void qc.invalidateQueries({ queryKey: ['workerIncoming'] });
      void qc.invalidateQueries({ queryKey: ['allRequests'] });
    },
  });
}

export function useAssignWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, workerId, workerName }: { requestId: string; workerId: string; workerName: string }) =>
      assignWorker(requestId, workerId, workerName),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['requestLive'] });
      void qc.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
}

export function useAcceptRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, workerId }: { requestId: string; workerId: string }) =>
      acceptApiRequest(requestId, workerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workerIncoming'] });
      void qc.invalidateQueries({ queryKey: ['workerJobs'] });
    },
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, workerId }: { requestId: string; workerId: string }) =>
      rejectApiRequest(requestId, workerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workerIncoming'] });
    },
  });
}

export function useUpdateJobProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, status, note }: { requestId: string; status: JobProgressStatus; note?: string }) =>
      updateJobProgressApi(requestId, status, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workerJobs'] });
      void qc.invalidateQueries({ queryKey: ['requestLive'] });
    },
  });
}

export function useCompleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      workerId,
      productsCost,
      laborWage,
      note,
    }: {
      requestId: string;
      workerId: string;
      productsCost: number;
      laborWage: number;
      note?: string;
    }) => completeApiRequest(requestId, workerId, { productsCost, laborWage, note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workerJobs'] });
      void qc.invalidateQueries({ queryKey: ['requestLive'] });
    },
  });
}

export function usePayRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, method }: { requestId: string; method: 'cash' | 'upi' }) =>
      payForApiRequest(requestId, method),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['requestLive'] });
      void qc.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => cancelApiRequest(requestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['requestLive'] });
      void qc.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
}

export function useRateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      workerId,
      customerId,
      customerName,
      rating,
      comment,
    }: {
      requestId: string;
      workerId: string;
      customerId: string;
      customerName: string;
      rating: number;
      comment?: string;
    }) => rateWorkerForRequest(requestId, workerId, customerId, customerName, rating, comment),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['requestLive'] });
      void qc.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
}

export function useRaiseDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reason, description }: { requestId: string; reason: string; description: string }) =>
      raiseDispute(requestId, reason, description),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['requestLive'] });
    },
  });
}

export type { ServiceRequestDoc };