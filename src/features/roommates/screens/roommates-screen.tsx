import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import {
  Users,
  ShieldCheck,
  Sparkles,
  Lock,
  Edit3,
  Eye,
  EyeOff,
  Inbox,
} from 'lucide-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { useThemeColors } from '@/theme/use-theme-colors';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getErrorCode } from '@/api/errors';
import {
  useRoommateProfile,
  useRoommateMatches,
  useSetRoommateProfileActive,
  useSendRoommateRequest,
} from '../queries';
import { matchDtoToCardViewModel } from '../mappers';
import { MatchCard } from '../components/match-card';
import { MatchCardSkeleton } from '../components/match-card-skeleton';
import { SendRequestSheet } from '../components/send-request-sheet';
import type { RoommateMatchCardViewModel } from '../types';

export function RoommatesScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useRoommateProfile();

  const isProfileActive = Boolean(profile?.isActive);

  const {
    data: matchesData,
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    error: matchesError,
    refetch: refetchMatches,
    isRefetching: isMatchesRefetching,
  } = useRoommateMatches(isProfileActive);

  const setActiveMutation = useSetRoommateProfileActive();
  const sendRequestMutation = useSendRoommateRequest();

  useRefreshOnFocus(() => {
    void refetchProfile();
    if (isProfileActive) {
      void refetchMatches();
    }
  });

  // Selected student for request sheet
  const [selectedStudent, setSelectedStudent] = useState<RoommateMatchCardViewModel | null>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const handleRequestPress = (item: RoommateMatchCardViewModel) => {
    setSelectedStudent(item);
    sheetRef.current?.expand();
  };

  const handleSendRequest = async (message?: string) => {
    if (!selectedStudent) return;
    await sendRequestMutation.mutateAsync({
      toUid: selectedStudent.id,
      message,
    });
    sheetRef.current?.close();
    setSelectedStudent(null);
  };

  const matchCardViewModels = (matchesData?.items ?? []).map(matchDtoToCardViewModel);

  // 1. Loading state (either profile is loading or active profile's matches are loading)
  if (isProfileLoading || (isProfileActive && isMatchesLoading)) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 p-4" testID="roommates-skeleton">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="h-8 w-36 rounded-md bg-muted" />
            <View className="h-8 w-24 rounded-md bg-muted" />
          </View>
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  // 2. Profile query error (undefined means it failed; null means "no profile yet")
  if (isProfileError || profile === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 p-4">
          <ErrorState
            code={profileError ? getErrorCode(profileError) : undefined}
            onRetry={() => refetchProfile()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // 3. No profile exists -> Show Intro Screen
  if (profile === null) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 110, justifyContent: 'center' }}
          testID="roommates-intro"
        >
          <View className="items-center text-center">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <Users size={40} color={colors.primary} />
            </View>

            <Text className="mb-3 text-center font-heading text-h1 text-foreground">
              {t('roommates.introTitle', 'Find your ideal college roommate')}
            </Text>

            <Text className="mb-8 text-center font-body text-body text-muted-foreground">
              {t(
                'roommates.introSubtitle',
                'Connect with verified students based on compatibility, lifestyle, and budget.',
              )}
            </Text>

            {/* 3 Benefit Points */}
            <View className="w-full gap-4 rounded-2xl border border-border bg-card p-5">
              <View className="flex-row items-start gap-3.5">
                <View className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <ShieldCheck size={18} color={colors.primary} />
                </View>
                <Text className="flex-1 font-body text-sm text-foreground">
                  {t(
                    'roommates.benefit1',
                    'Direct contact with verified students — 0% brokerage',
                  )}
                </Text>
              </View>

              <View className="flex-row items-start gap-3.5">
                <View className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <Sparkles size={18} color={colors.primary} />
                </View>
                <Text className="flex-1 font-body text-sm text-foreground">
                  {t(
                    'roommates.benefit2',
                    'Smart compatibility scoring on lifestyle & budget',
                  )}
                </Text>
              </View>

              <View className="flex-row items-start gap-3.5">
                <View className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                  <Lock size={18} color={colors.primary} />
                </View>
                <Text className="flex-1 font-body text-sm text-foreground">
                  {t(
                    'roommates.benefit3',
                    'Private & safe: contact details revealed only after mutual acceptance',
                  )}
                </Text>
              </View>
            </View>

            <Button
              onPress={() => router.push('/(student)/roommate-profile')}
              size="lg"
              className="mt-8 w-full"
              accessibilityRole="button"
              accessibilityLabel={t('roommates.createProfile', 'Create my roommate profile')}
            >
              <Text className="font-heading-semibold text-body text-primary-foreground">
                {t('roommates.createProfile', 'Create my roommate profile')}
              </Text>
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 4. Profile exists -> Header + Banner / Matches List
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="border-b border-border/40 px-4 pb-3 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-heading text-h2 text-foreground">
              {t('roommates.title', 'Roommates')}
            </Text>

            <View className="flex-row items-center gap-2">
              {/* Requests button */}
              <TouchableOpacity
                onPress={() => router.push('/(student)/roommate-requests')}
                className="flex-row items-center rounded-lg bg-secondary px-2.5 py-1.5"
                accessibilityRole="button"
                accessibilityLabel={t('roommates.requests', 'Requests')}
              >
                <Inbox size={15} color={colors.foreground} className="mr-1" />
                <Text className="font-body-semibold text-xs text-foreground">
                  {t('roommates.requests', 'Requests')}
                </Text>
              </TouchableOpacity>

              {/* Edit profile */}
              <TouchableOpacity
                onPress={() => router.push('/(student)/roommate-profile')}
                className="rounded-lg bg-secondary p-2"
                accessibilityRole="button"
                accessibilityLabel={t('roommates.editProfile', 'Edit profile')}
              >
                <Edit3 size={16} color={colors.foreground} />
              </TouchableOpacity>

              {/* Toggle Active/Hidden */}
              <TouchableOpacity
                onPress={() => setActiveMutation.mutate(!profile.isActive)}
                disabled={setActiveMutation.isPending}
                className="rounded-lg bg-secondary p-2"
                accessibilityRole="button"
                accessibilityLabel={
                  profile.isActive
                    ? t('roommates.hideProfile', 'Hide profile')
                    : t('roommates.showProfile', 'Show profile')
                }
              >
                {profile.isActive ? (
                  <EyeOff size={16} color={colors.mutedForeground} />
                ) : (
                  <Eye size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Hidden Banner */}
        {!profile.isActive ? (
          <View
            testID="roommates-hidden-banner"
            className="m-4 rounded-2xl border border-warning/40 bg-warning/10 p-5 items-center text-center"
          >
            <View className="mb-2 rounded-full bg-warning/20 p-2">
              <EyeOff size={24} color={colors.warning} />
            </View>
            <Text className="text-center font-heading-semibold text-body text-foreground mb-1">
              {t('roommates.hiddenBanner', 'Your profile is hidden, matches are paused')}
            </Text>
            <Text className="mb-4 text-center font-body text-xs text-muted-foreground">
              {t('roommates.hiddenBannerBody')}
            </Text>
            <Button
              onPress={() => setActiveMutation.mutate(true)}
              loading={setActiveMutation.isPending}
              size="default"
              accessibilityRole="button"
              accessibilityLabel={t('roommates.showProfile', 'Show profile')}
            >
              <Text className="font-heading-semibold text-sm text-primary-foreground">
                {t('roommates.showProfile', 'Show profile')}
              </Text>
            </Button>
          </View>
        ) : isMatchesError ? (
          <View className="flex-1 p-4">
            <ErrorState
              code={matchesError ? getErrorCode(matchesError) : undefined}
              onRetry={() => refetchMatches()}
            />
          </View>
        ) : matchCardViewModels.length === 0 ? (
          <View className="flex-1" testID="roommates-empty">
            <EmptyState
              icon={Users}
              title={t('roommates.noMatchesTitle', 'No matches yet')}
              description={t(
                'roommates.noMatchesDescription',
                'Try widening your budget or adding more preferred localities to find compatible students.',
              )}
              actionLabel={t('roommates.editProfile', 'Edit profile')}
              onAction={() => router.push('/(student)/roommate-profile')}
            />
          </View>
        ) : (
          <FlashList
            testID="roommates-matches-list"
            data={matchCardViewModels}
            renderItem={({ item }) => (
              <MatchCard
                item={item}
                onRequestPress={handleRequestPress}
                isSending={sendRequestMutation.isPending && selectedStudent?.id === item.id}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
            refreshControl={
              <RefreshControl
                refreshing={isMatchesRefetching}
                onRefresh={() => {
                  void refetchMatches();
                }}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
      </View>

      {/* Send Request Bottom Sheet */}
      <SendRequestSheet
        ref={sheetRef}
        targetStudent={selectedStudent}
        onSend={handleSendRequest}
        isSending={sendRequestMutation.isPending}
        onClose={() => setSelectedStudent(null)}
      />
    </SafeAreaView>
  );
}

export default RoommatesScreen;
