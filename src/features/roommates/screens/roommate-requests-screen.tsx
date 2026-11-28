import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Inbox, Send } from 'lucide-react-native';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { RubberSegment } from '@/components/common/rubber-segment';
import { useThemeColors } from '@/theme/use-theme-colors';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { flattenPages } from '@/api/pagination';
import { getErrorCode } from '@/api/errors';
import {
  useInfiniteRoommateRequests,
  useRoommateRequestAction,
} from '../queries';
import { requestDtoToCardViewModel } from '../mappers';
import { RequestCard } from '../components/request-card';
import { MatchCardSkeleton } from '../components/match-card-skeleton';
import type { RoommateRequestActionDto } from '../types';

export function RoommateRequestsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [direction, setDirection] = useState<'incoming' | 'outgoing'>('incoming');

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
  } = useInfiniteRoommateRequests(direction);

  const actionMutation = useRoommateRequestAction();

  useRefreshOnFocus(refetch);

  const requestCardViewModels = useMemo(() => {
    const rawItems = flattenPages(data?.pages);
    return rawItems.map((item) => requestDtoToCardViewModel(item, direction));
  }, [data?.pages, direction]);

  const handleAction = (id: string, action: RoommateRequestActionDto['action']) => {
    actionMutation.mutate({ id, action });
  };

  const segmentItems = [
    { value: 'incoming', label: t('roommates.incoming', 'Incoming') },
    { value: 'outgoing', label: t('roommates.outgoing', 'Outgoing') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="border-b border-border/40 px-4 pb-3 pt-2">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="rounded-full bg-secondary p-2"
              accessibilityRole="button"
              accessibilityLabel={t('common.back', 'Back')}
            >
              <ArrowLeft size={18} color={colors.foreground} />
            </TouchableOpacity>

            <Text className="font-heading text-h2 text-foreground">
              {t('roommates.requestsTitle', 'Roommate Requests')}
            </Text>
          </View>

          {/* Segment Control */}
          <View className="mt-3">
            <RubberSegment
              items={segmentItems}
              value={direction}
              onChange={(val) => setDirection(val as 'incoming' | 'outgoing')}
              trackColor={colors.secondary}
              thumbColor={colors.card}
              textColor={colors.mutedForeground}
              activeTextColor={colors.foreground}
            />
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 p-4" testID="requests-skeleton">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </View>
        ) : isError ? (
          <View className="flex-1 p-4">
            <ErrorState
              code={getErrorCode(error)}
              onRetry={() => refetch()}
              className="flex-1"
            />
          </View>
        ) : requestCardViewModels.length === 0 ? (
          <View className="flex-1">
            <EmptyState
              icon={direction === 'incoming' ? Inbox : Send}
              title={
                direction === 'incoming'
                  ? t('roommates.emptyIncomingTitle', 'No incoming requests')
                  : t('roommates.emptyOutgoingTitle', 'No outgoing requests')
              }
              description={
                direction === 'incoming'
                  ? t(
                      'roommates.emptyIncomingDesc',
                      'When students want to connect with you, their requests will appear here.',
                    )
                  : t(
                      'roommates.emptyOutgoingDesc',
                      "You haven't sent any roommate requests yet. Browse your matches and reach out!",
                    )
              }
              actionLabel={
                direction === 'outgoing'
                  ? t('roommates.title', 'Browse Roommates')
                  : undefined
              }
              onAction={
                direction === 'outgoing'
                  ? () => router.push('/(student)/(tabs)/roommates')
                  : undefined
              }
            />
          </View>
        ) : (
          <FlashList
            data={requestCardViewModels}
            renderItem={({ item }) => (
              <RequestCard
                item={item}
                onAccept={(id) => handleAction(id, 'accept')}
                onDecline={(id) => handleAction(id, 'decline')}
                onCancel={(id) => handleAction(id, 'cancel')}
                isActionLoading={actionMutation.isPending}
              />
            )}
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
          />
        )}
      </View>
    </SafeAreaView>
  );
}

export default RoommateRequestsScreen;
