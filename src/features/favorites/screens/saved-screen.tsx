import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Heart, MapPin, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { PriceTag } from '@/components/common/price-tag';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { SavedCardSkeleton } from '@/components/common/list-skeletons';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useThemeColors } from '@/theme/use-theme-colors';
import { getErrorCode } from '@/api/errors';
import { flattenPages } from '@/api/pagination';
import { useInfiniteFavoritesQuery, useRemoveFavoriteMutation } from '../queries';
import { favoriteCardDtoToViewModel } from '../mappers';
import type { FavoriteCardViewModel } from '../types';

export function SavedScreen() {
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
  } = useInfiniteFavoritesQuery();

  const removeMutation = useRemoveFavoriteMutation();

  useRefreshOnFocus(refetch);

  const items = useMemo(() => {
    const dtos = flattenPages(data?.pages);
    return dtos.map((d) => favoriteCardDtoToViewModel(d));
  }, [data?.pages]);

  const handleRemove = useCallback(
    (propertyId: string) => {
      removeMutation.mutate(propertyId);
    },
    [removeMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: FavoriteCardViewModel }) => {
      const isUnavailable = !item.available;

      return (
        // The remove button sits beside the card's link, not inside it: nested
        // buttons are invalid on web and read badly with screen readers.
        <View
          className={`shadow-elevation-1 mb-4 overflow-hidden rounded-xl border border-border bg-card ${
            isUnavailable ? 'opacity-60' : ''
          }`}
        >
          <TouchableOpacity
            onPress={() => router.push(`/property/${item.id}`)}
            className="flex-row"
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.locality}, ${item.cityDisplayName}`}
          >
            <View className="relative h-32 w-32 bg-muted">
              {item.coverImageUrl ? (
                <Image
                  source={{ uri: item.coverImageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-muted">
                  <Text className="font-body text-xs text-muted-foreground">No image</Text>
                </View>
              )}
              {isUnavailable && (
                <View className="absolute inset-0 items-center justify-center bg-background/70 p-1">
                  <Text className="text-center font-body-semibold text-[11px] text-destructive">
                    {t('saved.noLongerAvailable', 'No longer available')}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-1 justify-between p-3">
              <View>
                <PriceTag paise={item.rentPaise} size="sm" />
                <Text
                  className="mt-0.5 font-body-semibold text-sm text-foreground"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <MapPin size={12} color={colors.mutedForeground} className="mr-1" />
                  <Text className="font-body text-xs text-muted-foreground">
                    {item.locality}, {item.cityDisplayName}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between border-t border-border/40 pt-2">
                <Text className="font-body-medium text-xs text-primary">{item.roomTypeLabel}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemove(item.id)}
            className="absolute bottom-2 right-2 p-1"
            accessibilityRole="button"
            accessibilityLabel={t('saved.remove', 'Remove from saved')}
            hitSlop={8}
          >
            <Trash2 size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      );
    },
    [colors.destructive, colors.mutedForeground, handleRemove, t],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-border bg-card px-4 py-3">
        <Text className="font-heading text-h2 text-foreground">{t('saved.title', 'Saved')}</Text>
        <Text className="font-body text-xs text-muted-foreground">
          {t('saved.count', {
            count: items.length,
            defaultValue: `${items.length} saved`,
          })}
        </Text>
      </View>

      {isLoading ? (
        <View className="gap-4 p-4">
          <SavedCardSkeleton />
          <SavedCardSkeleton />
          <SavedCardSkeleton />
        </View>
      ) : isError ? (
        <ErrorState code={getErrorCode(error)} onRetry={() => refetch()} className="flex-1" />
      ) : items.length === 0 ? (
        <EmptyState
          title={t('saved.emptyTitle', 'No saved properties yet')}
          description={t(
            'saved.emptyDescription',
            'Tap the heart icon on any listing to save it for quick access later.',
          )}
          actionLabel={t('saved.exploreRooms', 'Explore Rooms')}
          onAction={() => router.push('/(student)/(tabs)/explore')}
          icon={Heart}
        />
      ) : (
        <FlashList
          data={items}
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
                <SavedCardSkeleton />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

export default SavedScreen;
