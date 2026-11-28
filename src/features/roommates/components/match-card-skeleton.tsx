import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

export function MatchCardSkeleton() {
  return (
    <View
      testID="match-card-skeleton"
      className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      {/* Header: Avatar, Name, Score Badge */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <View className="gap-1.5">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </View>
        </View>
        <Skeleton className="h-7 w-20 rounded-full" />
      </View>

      {/* Budget & Move-in */}
      <View className="my-3 flex-row gap-4 border-y border-border/50 py-2.5">
        <View className="flex-1 gap-1">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </View>
        <View className="flex-1 gap-1">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </View>
      </View>

      {/* Localities & Bio */}
      <View className="gap-2">
        <Skeleton className="h-3 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
      </View>

      {/* Reason Chips */}
      <View className="mt-3 flex-row flex-wrap gap-1.5">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </View>

      {/* Action Button */}
      <View className="mt-4">
        <Skeleton className="h-11 w-full rounded-md" />
      </View>
    </View>
  );
}
