import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BadgeCheck, MapPin, Star } from 'lucide-react-native';

import { Stars } from '@/components/ui/Stars';
import type { WorkerProfileDoc } from '@/lib/types';

const TOP_RATED_THRESHOLD = 4.8;

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatKm(metres?: number): string | null {
  if (typeof metres !== 'number') return null;
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

type Props = {
  worker: WorkerProfileDoc;
  onRequest?: (worker: WorkerProfileDoc) => void;
  requestLabel?: string;
  selected?: boolean;
};

export function WorkerCard({ worker, onRequest, requestLabel = 'Request', selected }: Props) {
  const distance = formatKm(worker._distance);
  const topRated = worker.rating >= TOP_RATED_THRESHOLD;

  return (
    <View
      className={`border rounded-lg p-4 bg-background mb-3 ${selected ? 'border-primary' : 'border-border'}`}
    >
      <View className="flex-row">
        <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
          <Text className="text-primary font-display">{initials(worker.name)}</Text>
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-foreground font-sans">{worker.name}</Text>
            {worker.verificationStatus === 'approved' ? (
              <BadgeCheck size={14} color="#7A1B1C" style={{ marginLeft: 6 }} />
            ) : null}
            {worker.isOnline ? (
              <View className="w-2 h-2 rounded-full bg-accent ml-2" />
            ) : null}
          </View>

          <View className="flex-row items-center mt-1">
            <Stars value={worker.rating} size={12} />
            <Text className="text-muted-fg text-xs ml-2 font-mono">
              {worker.rating.toFixed(1)} · {worker.ratingCount} jobs
            </Text>
          </View>
        </View>
      </View>

      {topRated || worker.verificationStatus === 'approved' ? (
        <View className="flex-row gap-2 mt-3">
          {topRated ? (
            <View className="flex-row items-center bg-secondary rounded-full px-2 py-0.5">
              <Star size={10} color="#D97706" />
              <Text className="text-accent text-[10px] ml-1 font-sans">Top rated</Text>
            </View>
          ) : null}
          {worker.verificationStatus === 'approved' ? (
            <View className="bg-secondary rounded-full px-2 py-0.5">
              <Text className="text-primary text-[10px] font-sans">ID verified</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row flex-wrap gap-1 mt-3">
        {worker.categorySkills.slice(0, 4).map((skill) => (
          <View key={skill} className="bg-muted rounded-full px-2 py-0.5">
            <Text className="text-muted-fg text-[10px]">{skill}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-center flex-wrap mt-3">
        {worker.area || worker.pincode ? (
          <View className="flex-row items-center mr-4">
            <MapPin size={12} color="#786061" />
            <Text className="text-muted-fg text-xs ml-1">
              {[worker.area, worker.pincode].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}
        {distance ? <Text className="text-muted-fg text-xs mr-4 font-mono">{distance} away</Text> : null}
        {typeof worker.avgResponseMin === 'number' ? (
          <Text className="text-muted-fg text-xs font-mono">~{worker.avgResponseMin}m response</Text>
        ) : null}
      </View>

      {onRequest ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onRequest(worker)}
          disabled={!worker.isOnline}
          className={`mt-4 rounded-md py-2.5 items-center ${
            worker.isOnline ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <Text className={`font-sans ${worker.isOnline ? 'text-white' : 'text-muted-fg'}`}>
            {worker.isOnline ? requestLabel : `${worker.name} is offline`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}