import React, { useMemo, useCallback } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Plus, Building2, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StatusPill } from '@/components/common/status-pill';
import { PriceTag } from '@/components/common/price-tag';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { TiltedCard } from '@/components/common/tilted-card';
import { ListingCardSkeleton } from '@/components/common/list-skeletons';
import { Button } from '@/components/ui/button';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useThemeColors } from '@/theme/use-theme-colors';
import { getErrorCode } from '@/api/errors';
import { flattenPages } from '@/api/pagination';
import { useMyListingsQuery } from '../queries';
import { propertyOwnerDtoToViewModel } from '../mappers';
import type { OwnerListingViewModel } from '../types';

export function OwnerListingsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

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
  } = useMyListingsQuery();

  useRefreshOnFocus(refetch);

  const listings = useMemo(() => {
    const dtos = flattenPages(data?.pages);
    return dtos.map((d) => propertyOwnerDtoToViewModel(d));
  }, [data?.pages]);

  const renderItem = useCallback(
    ({ item, index }: { item: OwnerListingViewModel; index: number }) => (
      <View className="mb-4">
        <TiltedCard
          imageSrc={item.images[0]?.url}
          captionText={`Status: ${item.status}`}
          imageHeight={160}
          radius={16}
          rotateAmplitude={12}
          index={index}
          onClick={() => router.push(`/property/${item.id}`)}
        >
          <View className="bg-card p-3.5">
            <View className="mb-1 flex-row items-center justify-between">
              <PriceTag paise={item.rentPaise} size="sm" />
              <View className="flex-row items-center gap-1.5">
                <StatusPill status={item.status} />
                <Text className="font-body-medium text-xs capitalize text-muted-foreground">
                  {item.roomTypeLabel}
                </Text>
              </View>
            </View>

            <Text
              className="mb-1 font-body-semibold text-body text-foreground"
              numberOfLines={1}
            >
              {item.title}
            </Text>

            <View className="flex-row items-center text-muted-foreground">
              <MapPin size={12} color={colors.mutedForeground} className="mr-1" />
              <Text className="font-body text-xs text-muted-foreground">
                {item.locality}, {item.city}
              </Text>
            </View>
          </View>
        </TiltedCard>
      </View>
    ),
    [colors.mutedForeground],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <View>
          <Text className="font-heading text-h2 text-foreground">
            {t('listings.title', 'Listings')}
          </Text>
          <Text className="font-body text-xs text-muted-foreground">
            {t('listings.managedProperties', {
              count: listings.length,
              defaultValue: `${listings.length} managed properties`,
            })}
          </Text>
        </View>
        <Button
          onPress={() => router.push('/property/new')}
          size="sm"
          className="flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel="Add Listing"
        >
          <Plus size={16} color={colors.primaryForeground} className="mr-1" />
          <Text className="font-body-semibold text-xs text-primary-foreground">
            {t('listings.addListing', 'Add Listing')}
          </Text>
        </Button>
      </View>

      {isLoading ? (
        <View className="gap-4 p-4">
          <ListingCardSkeleton />
          <ListingCardSkeleton />
        </View>
      ) : isError ? (
        <ErrorState
          code={getErrorCode(error)}
          onRetry={() => refetch()}
          className="flex-1"
        />
      ) : listings.length === 0 ? (
        <EmptyState
          title={t('listings.emptyTitle', 'No properties listed yet')}
          description={t(
            'listings.emptyDescription',
            'List your student rooms, PGs, or flats to connect directly with college students.',
          )}
          actionLabel={t('listings.createFirstListing', 'Create First Listing')}
          onAction={() => router.push('/property/new')}
          icon={Building2}
        />
      ) : (
        <FlashList
          data={listings}
          renderItem={renderItem}
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
                <ListingCardSkeleton />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

export default OwnerListingsScreen;
