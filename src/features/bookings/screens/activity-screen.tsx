import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { CalendarClock, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getDB } from '@/api/mock/db';
import { StatusPill } from '@/components/common/status-pill';
import { PriceTag } from '@/components/common/price-tag';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { BookingCardSkeleton } from '@/components/common/list-skeletons';
import { RubberSegment } from '@/components/common/rubber-segment';
import { formatIST } from '@/lib/dates';
import { useThemeColors } from '@/theme/use-theme-colors';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getErrorCode } from '@/api/errors';
import { flattenPages } from '@/api/pagination';
import { useInfiniteBookingsQuery } from '../queries';
import { bookingDtoToViewModel } from '../mappers';
import type { BookingViewModel } from '../types';

export function ActivityScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'bookings' | 'tours'>('bookings');

  // ─── Bookings Query ───────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteBookingsQuery();

  useRefreshOnFocus(refetch);

  const bookings = useMemo(() => {
    const dtos = flattenPages(data?.pages);
    return dtos.map((d) => bookingDtoToViewModel(d));
  }, [data?.pages]);

  // Tours stay on mocks until feature 08 is wired (see docs/mobile-plan.md).
  const db = getDB();
  const tours = db.tours;

  const renderBookingItem = useCallback(
    ({ item }: { item: BookingViewModel }) => (
      <TouchableOpacity
        key={item.id}
        onPress={() => router.push(`/booking/${item.id}`)}
        className="shadow-elevation-1 mb-3 rounded-xl border border-border bg-card p-4"
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Booking for ${item.propertyTitle}, status: ${item.statusLabel}`}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <StatusPill status={item.status} />
          <Text className="font-body text-xs text-muted-foreground">
            {formatIST(item.createdAt, 'dd MMM yyyy')}
          </Text>
        </View>

        <Text className="mb-1 font-body-semibold text-body text-foreground" numberOfLines={1}>
          {item.propertyTitle}
        </Text>

        <View className="mb-3 flex-row items-center text-muted-foreground">
          <MapPin size={13} color={colors.mutedForeground} className="mr-1" />
          <Text className="font-body text-xs text-muted-foreground">
            {item.locality}, {item.citySlug}
          </Text>
        </View>

        <View className="flex-row items-center justify-between border-t border-border/60 pt-3">
          <PriceTag paise={item.agreedRentPaise} size="sm" />
          <View className="flex-row items-center">
            <Text className="mr-1 font-body-medium text-xs text-primary">
              {t('activity.viewTimeline', 'View Timeline')}
            </Text>
            <ChevronRight size={14} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    ),
    [colors.mutedForeground, colors.primary, t],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-border bg-card px-4 py-3">
        <Text className="font-heading text-h2 text-foreground">
          {t('activity.title', 'Activity')}
        </Text>

        {/* Dynamic RubberSegment for Smooth Tab Switching */}
        <View className="mt-3">
          <RubberSegment
            items={[
              {
                value: 'bookings',
                label: `${t('activity.bookings', 'Bookings')} (${bookings.length})`,
              },
              {
                value: 'tours',
                label: `${t('activity.tours', 'Tours')} (${tours.length})`,
              },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'bookings' | 'tours')}
            trackColor={colors.muted}
            thumbColor={colors.card}
            textColor={colors.mutedForeground}
            activeTextColor={colors.foreground}
            size="md"
            radius={12}
          />
        </View>
      </View>

      {activeTab === 'bookings' ? (
        isLoading ? (
          <View className="gap-3 p-4">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </View>
        ) : isError ? (
          <ErrorState
            code={getErrorCode(error)}
            onRetry={() => refetch()}
            className="flex-1"
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            title={t('activity.bookingsEmptyTitle', 'No bookings yet')}
            description={t(
              'activity.bookingsEmptyDescription',
              'When you apply to book a verified room, track your application timeline here.',
            )}
            actionLabel={t('activity.findRoom', 'Find a Room')}
            onAction={() => router.push('/(student)/(tabs)/explore')}
            icon={CalendarClock}
          />
        ) : (
          <FlashList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => {
                void refetch();
              }}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="mt-2">
                  <BookingCardSkeleton />
                </View>
              ) : null
            }
          />
        )
      ) : tours.length === 0 ? (
        <EmptyState
          title={t('activity.toursEmptyTitle', 'No scheduled tours')}
          description={t(
            'activity.toursEmptyDescription',
            'Request a physical or virtual tour from any property page to visit before booking.',
          )}
          actionLabel={t('activity.findRoom', 'Find a Room')}
          onAction={() => router.push('/(student)/(tabs)/explore')}
          icon={Calendar}
        />
      ) : (
        /* Tours segment stay on mocks until feature 08 is wired (see docs/mobile-plan.md). */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        >
          <View className="gap-3">
            {tours.map((tour) => {
              const property = db.properties.find((p) => p.id === tour.propertyId);
              return (
                <TouchableOpacity
                  key={tour.id}
                  onPress={() => router.push(`/tour/${tour.id}`)}
                  className="shadow-elevation-1 rounded-xl border border-border bg-card p-4"
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Tour for ${property?.title ?? 'Student Room'}`}
                >
                  <View className="mb-2 flex-row items-center justify-between">
                    <StatusPill status={tour.status} />
                    <Text className="font-body text-xs text-muted-foreground">
                      {formatIST(tour.createdAt, 'dd MMM yyyy')}
                    </Text>
                  </View>

                  <Text className="mb-1 font-body-semibold text-body text-foreground">
                    {property?.title ?? 'Student Room Tour'}
                  </Text>

                  {tour.confirmedSlot && (
                    <View className="mb-2 mt-2 flex-row items-center rounded-lg bg-muted/60 p-2">
                      <Clock size={14} color={colors.primary} className="mr-2" />
                      <Text className="font-body-medium text-xs text-foreground">
                        Confirmed: {formatIST(tour.confirmedSlot, 'dd MMM yyyy, hh:mm a')}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between pt-2">
                    <Text className="font-body text-xs text-muted-foreground">
                      {tour.address ?? `${property?.locality}, ${property?.city}`}
                    </Text>
                    <ChevronRight size={14} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default ActivityScreen;
