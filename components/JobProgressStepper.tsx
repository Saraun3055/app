import React from 'react';
import { Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { RequestStatus } from '@/lib/types';

export const JOB_STEPS: { status: RequestStatus; label: string }[] = [
  { status: 'searching', label: 'Searching' },
  { status: 'pending_worker_response', label: 'Notified' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'on_the_way', label: 'On the way' },
  { status: 'arrived', label: 'Arrived' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'completed', label: 'Complete' },
];

const STEP_INDEX: Record<RequestStatus, number> = {
  searching: 0,
  pending_worker_response: 1,
  accepted: 2,
  on_the_way: 3,
  arrived: 4,
  in_progress: 5,
  completed: 6,
  rejected: -1,
  cancelled: -1,
};

/** Horizontal 7-step timeline used on the customer live-status screen. */
export function JobProgressStepper({
  status,
  labels = JOB_STEPS.map((s) => s.label),
}: {
  status: RequestStatus;
  labels?: string[];
}) {
  const current = STEP_INDEX[status] ?? 0;
  const aborted = current < 0;

  return (
    <View>
      <View className="flex-row items-start">
        {JOB_STEPS.map((step, i) => {
          const done = !aborted && i <= current;
          const isCurrent = !aborted && i === current;
          return (
            <View key={step.status} className="flex-1 items-center">
              <View className="flex-row w-full items-center">
                <View className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done ? 'bg-accent' : 'bg-border'}`} />
                <View
                  className={`w-4 h-4 rounded-full items-center justify-center ${
                    aborted
                      ? 'bg-border'
                      : isCurrent
                        ? 'bg-primary'
                        : done
                          ? 'bg-accent'
                          : 'bg-border'
                  }`}
                />
                <View
                  className={`h-0.5 flex-1 ${i === JOB_STEPS.length - 1 ? 'opacity-0' : done ? 'bg-accent' : 'bg-border'}`}
                />
              </View>
              <Text
                className={`text-[10px] mt-1.5 text-center ${
                  isCurrent ? 'text-primary font-sans' : done ? 'text-accent font-sans' : 'text-muted-fg'
                }`}
                numberOfLines={1}
              >
                {labels[i] ?? step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {aborted ? (
        <Text className="text-destructive text-xs mt-3 text-center">
          This request was {status === 'rejected' ? 'declined' : 'cancelled'}.
        </Text>
      ) : null}
    </View>
  );
}

/** Vertical variant for worker screens where only 4 stages matter. */
export function CompactJobStepper({ status }: { status: RequestStatus }) {
  const stages: RequestStatus[] = ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'];
  const current = stages.indexOf(status);

  return (
    <View className="flex-row items-center">
      {stages.map((stage, i) => (
        <View key={stage} className="flex-1 items-center">
          <View
            className={`h-1.5 flex-1 rounded-full mx-0.5 ${
              current >= 0 && i <= current ? 'bg-accent' : 'bg-border'
            }`}
          />
        </View>
      ))}
    </View>
  );
}

export const STEPPER_COLORS = { active: colors.primary, done: colors.accent, idle: colors.border };