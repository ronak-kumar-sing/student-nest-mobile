import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

export function RoomCardSkeleton() {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="h-48 w-full rounded-none" />
      <View className="p-3.5">
        <View className="mb-2 flex-row items-center justify-between">
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </View>
        <Skeleton className="mb-2 h-5 w-3/4 rounded" />
        <Skeleton className="mb-3 h-4 w-1/2 rounded" />
        <View className="flex-row gap-1.5 border-t border-border/60 pt-2">
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
        </View>
      </View>
    </View>
  );
}

export function SavedCardSkeleton() {
  return (
    <View className="flex-row overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="h-32 w-32 rounded-none" />
      <View className="flex-1 justify-between p-3">
        <View>
          <Skeleton className="mb-1 h-5 w-20 rounded" />
          <Skeleton className="mb-2 h-4 w-3/4 rounded" />
          <Skeleton className="h-3.5 w-1/2 rounded" />
        </View>
        <View className="flex-row items-center justify-between border-t border-border/40 pt-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-6 rounded" />
        </View>
      </View>
    </View>
  );
}

export function BookingCardSkeleton() {
  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-3.5 w-24 rounded" />
      </View>
      <Skeleton className="mb-2 h-5 w-2/3 rounded" />
      <Skeleton className="mb-3 h-3.5 w-1/3 rounded" />
      <View className="flex-row items-center justify-between border-t border-border/60 pt-3">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </View>
    </View>
  );
}

export function ListingCardSkeleton() {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="h-40 w-full rounded-none" />
      <View className="p-3.5">
        <View className="mb-2 flex-row items-center justify-between">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </View>
        <Skeleton className="mb-2 h-5 w-3/4 rounded" />
        <Skeleton className="h-3.5 w-1/2 rounded" />
      </View>
    </View>
  );
}

export function PropertyDetailSkeleton() {
  return (
    <View className="flex-1 bg-background">
      <Skeleton className="h-72 w-full rounded-none" />
      <View className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Skeleton className="h-8 w-28 rounded" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </View>
        <Skeleton className="mb-2 h-6 w-4/5 rounded" />
        <Skeleton className="mb-4 h-4 w-1/2 rounded" />
        <Skeleton className="mb-5 h-16 w-full rounded-xl" />
        <Skeleton className="mb-5 h-20 w-full rounded-xl" />
        <Skeleton className="mb-5 h-32 w-full rounded-xl" />
      </View>
    </View>
  );
}
