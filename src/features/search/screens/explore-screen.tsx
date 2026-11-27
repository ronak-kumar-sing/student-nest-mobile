import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, SlidersHorizontal, MapPin, Wrench, Users } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useFiltersStore } from '@/stores/filters';
import { useDebounce } from '@/hooks/useDebounce';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useThemeColors } from '@/theme/use-theme-colors';
import { PriceTag } from '@/components/common/price-tag';
import { TiltedCard } from '@/components/common/tilted-card';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { RoomCardSkeleton } from '@/components/common/list-skeletons';
import { Chip } from '@/components/ui/chip';
import { getErrorCode } from '@/api/errors';
import { flattenPages } from '@/api/pagination';
import { useCitiesQuery, useInfiniteRoomsQuery } from '../queries';
import { buildSearchParams, roomCardDtoToViewModel } from '../mappers';
import type { RoomCardViewModel } from '../types';

export function ExploreScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const query = useFiltersStore((s) => s.query);
  const city = useFiltersStore((s) => s.city);
  const setFilter = useFiltersStore((s) => s.setFilter);
  const resetFilters = useFiltersStore((s) => s.resetFilters);

  const debouncedQuery = useDebounce(query, 300);

  // 1. Fetch cities
  const { data: cities = [], isLoading: isLoadingCities } = useCitiesQuery();

  // Active city selection (default to filters.city or first city's slug)
  const selectedCitySlug = useMemo(() => {
    if (city) return city.toLowerCase();
    if (cities.length > 0 && cities[0]) return cities[0].slug;
    return 'indore';
  }, [city, cities]);

  const selectedCityName = useMemo(() => {
    const found = cities.find((c) => c.slug === selectedCitySlug);
    return found ? found.name : 'Indore';
  }, [cities, selectedCitySlug]);

  // 2. Prepare search params
  const searchParams = useMemo(() => {
    const filters = useFiltersStore.getState();
    return buildSearchParams({ ...filters, query: debouncedQuery }, selectedCitySlug);
  }, [debouncedQuery, selectedCitySlug]);

  // 3. Infinite rooms query
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
  // Wait for the cities list so the first search uses the real default city
  // (the API requires `city` or `near`; there is no "all cities" search).
  } = useInfiniteRoomsQuery(searchParams, { enabled: !isLoadingCities });

  useRefreshOnFocus(refetch);

  const allItems = useMemo(() => {
    const pages = data?.pages;
    const dtos = flattenPages(pages);
    return dtos.map((dto) => roomCardDtoToViewModel(dto, selectedCityName));
  }, [data?.pages, selectedCityName]);

  const totalCount = data?.pages[0]?.total ?? allItems.length;

  const handleCitySelect = useCallback(
    (slug: string) => {
      setFilter('city', slug);
    },
    [setFilter],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: RoomCardViewModel; index: number }) => (
      <View className="mb-4">
        <TiltedCard
          imageSrc={item.coverImageUrl || undefined}
          captionText={item.ratingDisplay}
          imageHeight={185}
          radius={18}
          rotateAmplitude={14}
          index={index}
          onClick={() => router.push(`/property/${item.id}`)}
        >
          <View className="bg-card p-3.5">
            <View className="mb-1 flex-row items-center justify-between">
              <PriceTag paise={item.rentPaise} size="default" />
              <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
                <Text className="font-body-semibold text-[11px] capitalize text-primary">
                  {item.roomTypeLabel}
                </Text>
              </View>
            </View>

            <Text
              className="mb-1.5 font-body-semibold text-body text-foreground"
              numberOfLines={1}
            >
              {item.title}
            </Text>

            <View className="mb-2 flex-row items-center text-muted-foreground">
              <MapPin size={13} color={colors.mutedForeground} className="mr-1" />
              <Text className="font-body text-xs text-muted-foreground">
                {item.locality}, {item.cityDisplayName}
              </Text>
            </View>

            <View className="flex-row items-center justify-between border-t border-border/60 pt-2">
              <View className="rounded bg-muted px-2 py-0.5">
                <Text className="font-body text-xs text-muted-foreground">
                  {item.genderPolicyLabel}
                </Text>
              </View>
              <Text className="font-body text-xs text-muted-foreground">
                0% Brokerage
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
      {/* Header with Search and Dev Menu */}
      <View className="border-b border-border bg-card px-4 pb-3 pt-2">
        <View className="mb-3 flex-row items-center justify-between">
          <View>
            <Text className="font-heading text-h2 text-foreground">
              {t('search.title', 'Find Your Nest')}
            </Text>
            <Text className="font-body text-xs text-muted-foreground">
              {t('search.subtitle', 'Direct from verified owners • 0% Brokerage')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/dev')}
            className="flex-row items-center rounded-full bg-muted/80 px-2.5 py-1.5"
            accessibilityRole="button"
            accessibilityLabel="Open Dev Menu"
          >
            <Wrench size={13} color={colors.mutedForeground} className="mr-1" />
            <Text className="font-body-medium text-xs text-muted-foreground">Dev</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center rounded-xl border border-border bg-muted/70 px-3 py-2">
          <Search size={18} color={colors.mutedForeground} className="mr-2" />
          <TextInput
            placeholder={t('search.searchPlaceholder', 'Search locality, college, city...')}
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={(text) => setFilter('query', text)}
            className="flex-1 p-0 font-body text-sm text-foreground"
            accessibilityLabel="Search input"
          />
          <TouchableOpacity
            className="p-1"
            accessibilityRole="button"
            accessibilityLabel="Filter options"
          >
            <SlidersHorizontal size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* City Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 flex-row gap-2"
        >
          {cities.map((c) => (
            <Chip
              key={c.slug}
              label={c.name}
              selected={selectedCitySlug === c.slug}
              onPress={() => handleCitySelect(c.slug)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Content Area */}
      {isLoading || isLoadingCities ? (
        <View className="gap-4 p-4">
          <RoomCardSkeleton />
          <RoomCardSkeleton />
        </View>
      ) : isError ? (
        <ErrorState
          code={getErrorCode(error)}
          onRetry={() => refetch()}
          className="flex-1"
        />
      ) : allItems.length === 0 ? (
        <EmptyState
          title={t('search.noResults', 'No rooms found')}
          description={t(
            'search.noResultsDescription',
            'Try broadening your filters or searching a different area.',
          )}
          actionLabel={t('search.clearFilters', 'Clear all filters')}
          onAction={() => resetFilters()}
          icon={Search}
        />
      ) : (
        <FlashList
          data={allItems}
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
          ListHeaderComponent={
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-body-semibold text-sm text-foreground">
                {t('search.verifiedRoomsCount', {
                  count: totalCount,
                  city: selectedCityName,
                  defaultValue: `${totalCount} Verified Rooms in ${selectedCityName}`,
                })}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(student)/(tabs)/activity')}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="Find Roommates"
              >
                <Users size={14} color={colors.primary} className="mr-1" />
                <Text className="font-body-semibold text-xs text-primary">
                  {t('search.findRoommates', 'Find Roommates')}
                </Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="mt-4">
                <RoomCardSkeleton />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

export default ExploreScreen;
