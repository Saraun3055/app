import React from 'react';
import { Text, View, type ViewProps } from 'react-native';

import {
  DISPUTE_LABEL,
  STATUS_LABEL,
  VERIFICATION_LABEL,
  type DisputeStatus,
  type RequestStatus,
  type VerificationQueueStatus,
  type WorkerVerificationStatus,
} from '@/lib/types';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'destructive' | 'primary';

const TONE_BG: Record<BadgeTone, string> = {
  neutral: 'bg-muted border-border',
  success: 'bg-secondary border-accent',
  warning: 'bg-secondary border-accent',
  destructive: 'bg-muted border-destructive',
  primary: 'bg-primary border-primary',
};

const TONE_TEXT: Record<BadgeTone, string> = {
  neutral: 'text-muted-fg',
  success: 'text-primary',
  warning: 'text-accent',
  destructive: 'text-destructive',
  primary: 'text-white',
};

type BadgeProps = ViewProps & { label: string; tone?: BadgeTone };

export function Badge({ label, tone = 'neutral', className = '', style, ...rest }: BadgeProps) {
  return (
    <View
      className={`self-start rounded-full border px-3 py-1 ${TONE_BG[tone]} ${className}`}
      style={style}
      {...rest}
    >
      <Text className={`text-xs font-sans ${TONE_TEXT[tone]}`}>{label}</Text>
    </View>
  );
}

const STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  searching: 'neutral',
  pending_worker_response: 'warning',
  accepted: 'primary',
  on_the_way: 'primary',
  arrived: 'primary',
  in_progress: 'primary',
  rejected: 'destructive',
  completed: 'success',
  cancelled: 'neutral',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} />;
}

const VERIFICATION_TONE: Record<WorkerVerificationStatus, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

export function VerificationBadge({ status }: { status: WorkerVerificationStatus | VerificationQueueStatus }) {
  return <Badge label={VERIFICATION_LABEL[status]} tone={VERIFICATION_TONE[status]} />;
}

export function DisputeBadge({ status }: { status: DisputeStatus }) {
  return <Badge label={DISPUTE_LABEL[status]} tone={status === 'open' ? 'warning' : 'success'} />;
}

export function PaymentBadge({ status }: { status?: string }) {
  if (status === 'paid') return <Badge label="Payment complete" tone="success" />;
  return <Badge label="Payment due" tone="warning" />;
}