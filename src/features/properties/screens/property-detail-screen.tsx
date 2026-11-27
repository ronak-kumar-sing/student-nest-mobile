import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Share2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Home,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/theme/use-theme-colors';
import { formatINR } from '@/lib/money';
import { PriceTag } from '@/components/common/price-tag';
import { PulseHeart } from '@/components/common/pulse-heart';
import { BellToggle } from '@/components/common/bell-toggle';
import { SlideCommit } from '@/components/common/slide-commit';
import { SpotlightCard } from '@/components/common/spotlight-card';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { PropertyDetailSkeleton } from '@/components/common/list-skeletons';
import { toast } from '@/components/ui/toast';
import { getErrorCode, getErrorMessage } from '@/api/errors';
import { createIdempotencyKey } from '@/api/http';
import { queryKeyRoots } from '@/api/query-keys';

// Rule: Property screen may import ONLY from the public indices of favorites and bookings.
import { useToggleFavoriteMutation } from '@/features/favorites';
import { useCreateBookingMutation } from '@/features/bookings';

import { usePropertyQuery, propertyKeys } from '../queries';
import { propertyPublicDtoToViewModel } from '../mappers';
import type { PropertyPublicDto } from '../types';

export function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  const role = useSessionStore((s) => s.role);
  const isOwner = role === 'owner';

  const { data: rawProperty, isLoading, isError, error, refetch } = usePropertyQuery(id ?? '');

  const property = useMemo(() => {
    return rawProperty ? propertyPublicDtoToViewModel(rawProperty) : null;
  }, [rawProperty]);

  const { toggle: toggleFavorite } = useToggleFavoriteMutation();
  const createBookingMutation = useCreateBookingMutation();

  const handleFavoriteToggle = async (liked: boolean) => {
    if (!id || !property) return;

    // Optimistically update property detail cache
    const previous = queryClient.getQueryData<PropertyPublicDto>(propertyKeys.detail(id));
    if (previous) {
      queryClient.setQueryData<PropertyPublicDto>(propertyKeys.detail(id), {
        ...previous,
        isFavorite: liked,
      });
    }

    try {
      await toggleFavorite(id, !liked);
    } catch {
      // Roll back
      if (previous) {
        queryClient.setQueryData(propertyKeys.detail(id), previous);
      }
    }
  };

  const handleApply = async () => {
    if (!property) return;

    // Calculate moveInDate: later of (today + 7 days) and property.availableFrom
    const now = new Date();
    const defaultDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let chosenDate = defaultDate;

    if (property.availableFrom) {
      const availDate = new Date(property.availableFrom);
      if (availDate > defaultDate) {
        chosenDate = availDate;
      }
    }
    const moveInDate = chosenDate.toISOString().slice(0, 10);
    const durationMonths = Math.max(property.minStayMonths || 1, 6);

    const idempotencyKey = createIdempotencyKey();

    try {
      await createBookingMutation.mutateAsync({
        data: {
          propertyId: property.id,
          moveInDate,
          durationMonths,
          occupants: 1,
        },
        idempotencyKey,
      });

      toast.success(
        t('propertyDetail.applicationSubmitted', 'Booking application submitted successfully!'),
      );
      queryClient.invalidateQueries({ queryKey: [queryKeyRoots.bookings] });
    } catch (err: unknown) {
      // SlideCommit requires onConfirm to throw so it renders its error state
      // Mapped by error.code (e.g. PHONE_REQUIRED, DUPLICATE_APPLICATION, TOO_MANY_PENDING).
      toast.error(t(getErrorMessage(getErrorCode(err))));
      throw err;
    }
  };

  if (isLoading) {
    return <PropertyDetailSkeleton />;
  }

  if (isError) {
    const code = getErrorCode(error);
    if (code === 'NOT_FOUND') {
      return (
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 items-center justify-center p-6">
            <EmptyState
              title={t('propertyDetail.notFoundTitle', 'Listing no longer available')}
              description={t(
                'propertyDetail.notFoundDescription',
                'This room may have been unlisted, paused or filled by the owner.',
              )}
              actionLabel={t('propertyDetail.goBack', 'Go Back')}
              onAction={() => router.back()}
              icon={Home}
            />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-background">
        <ErrorState code={code} onRetry={() => refetch()} className="flex-1" />
      </SafeAreaView>
    );
  }

  if (!property) return null;

  return (
    <View className="flex-1 bg-background">
      {/* Top Floating Action Bar */}
      <SafeAreaView
        edges={['top']}
        className="absolute left-0 right-0 top-0 z-20 flex-row items-center justify-between px-4 pt-2"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-md"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          {!isOwner && (
            <PulseHeart
              liked={property.isFavorite}
              size={40}
              corner={20}
              likedColor={colors.destructive}
              pillColor={colors.card}
              onChange={(liked) => handleFavoriteToggle(liked)}
            />
          )}
          <TouchableOpacity
            onPress={() => toast.info('Link copied to clipboard')}
            className="h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-md"
            accessibilityRole="button"
            accessibilityLabel="Share listing"
          >
            <Share2 size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Image Gallery */}
        <View className="h-72 w-full bg-muted">
          {property.images[0]?.url ? (
            <Image
              source={{ uri: property.images[0].url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-muted">
              <Text className="font-body text-sm text-muted-foreground">No photos available</Text>
            </View>
          )}
        </View>

        <View className="p-4">
          {/* Price Block */}
          <View className="mb-2 flex-row items-baseline justify-between">
            <PriceTag paise={property.rentPaise} size="lg" />
            <View className="rounded-md bg-primary/10 px-2.5 py-1">
              <Text className="font-body-semibold text-xs capitalize text-primary">
                {property.roomTypeLabel}
              </Text>
            </View>
          </View>

          <Text className="mb-2 font-heading text-h3 text-foreground">{property.title}</Text>

          <View className="mb-4 flex-row items-center text-muted-foreground">
            <MapPin size={14} color={colors.mutedForeground} className="mr-1" />
            <Text className="font-body text-sm text-muted-foreground">
              {property.addressRevealed && property.address.line1
                ? `${property.address.line1}, ${property.address.locality}, ${property.address.city}`
                : `${property.address.locality}, ${property.address.city} (${t(
                    'propertyDetail.exactAddressRevealedAfterApproval',
                    'Exact address revealed after approval',
                  )})`}
            </Text>
          </View>

          {/* Deposit & Bills breakdown */}
          <View className="shadow-elevation-1 mb-5 flex-row justify-around rounded-xl border border-border bg-card p-3.5">
            <View className="items-center">
              <Text className="font-body text-xs text-muted-foreground">
                {t('propertyDetail.securityDeposit', 'Security Deposit')}
              </Text>
              <Text className="mt-0.5 font-body-semibold text-sm text-foreground">
                {formatINR(property.depositPaise)}
              </Text>
            </View>
            <View className="w-[1px] bg-border" />
            <View className="items-center">
              <Text className="font-body text-xs text-muted-foreground">
                {t('propertyDetail.maintenance', 'Maintenance')}
              </Text>
              <Text className="mt-0.5 font-body-semibold text-sm text-foreground">
                {property.maintenancePaise > 0 ? formatINR(property.maintenancePaise) : 'Included'}
              </Text>
            </View>
            <View className="w-[1px] bg-border" />
            <View className="items-center">
              <Text className="font-body text-xs text-muted-foreground">
                {t('propertyDetail.genderPolicy', 'Gender Policy')}
              </Text>
              <Text className="mt-0.5 font-body-semibold text-sm capitalize text-foreground">
                {property.genderPolicyLabel}
              </Text>
            </View>
          </View>

          {/* Bills Included */}
          <View className="mb-5 rounded-xl border border-border bg-card p-3.5">
            <Text className="mb-1 font-body-semibold text-xs uppercase text-muted-foreground">
              {t('propertyDetail.billsIncluded', 'Bills Included')}
            </Text>
            <Text className="font-body text-sm capitalize text-foreground">
              {property.billsIncluded.length > 0
                ? property.billsIncluded.join(', ')
                : 'None included in rent'}
            </Text>
          </View>

          {/* Owner Trust Badge with SpotlightCard */}
          {property.owner && (
            <View className="mb-5">
              <SpotlightCard
                theme="light"
                spotlightColor={colors.primary}
                intensity={0.16}
                spotlightSize={240}
                radius={18}
              >
                <View className="flex-row items-center p-4">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck size={24} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="mr-1.5 font-body-semibold text-body text-foreground">
                        {property.owner.displayName}
                      </Text>
                      {property.owner.verified && (
                        <View className="rounded bg-success/15 px-1.5 py-0.5">
                          <Text className="font-body-semibold text-[10px] text-success">
                            VERIFIED
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="font-body text-xs text-muted-foreground">
                      {property.owner.responseRate !== undefined
                        ? t('propertyDetail.responseRate', {
                            rate: Math.round(property.owner.responseRate * 100),
                            defaultValue: `${Math.round(property.owner.responseRate * 100)}% response rate`,
                          })
                        : t('propertyDetail.verifiedOwner', 'Verified Owner')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => router.push('/chat/inquiry-1')}
                    className="h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                    accessibilityRole="button"
                    accessibilityLabel="Chat with owner"
                  >
                    {/* Inquiries (09) stay on mocks. */}
                    <MessageSquare size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </SpotlightCard>
            </View>
          )}

          {/* Nearby Colleges & Landmarks */}
          {property.nearby.length > 0 && (
            <View className="mb-5">
              <Text className="mb-2 font-heading text-body text-foreground">
                {t('propertyDetail.nearbyPlaces', 'Nearby Colleges & Landmarks')}
              </Text>
              <View className="gap-2">
                {property.nearby.map((place, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <View className="flex-row items-center">
                      <MapPin size={16} color={colors.primary} className="mr-2" />
                      <Text className="font-body text-sm text-foreground">{place.name}</Text>
                    </View>
                    <Text className="font-body-medium text-xs text-muted-foreground">
                      {place.distanceKm} km away
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <View className="mb-5">
              <Text className="mb-2 font-heading text-body text-foreground">
                {t('propertyDetail.amenities', 'Amenities')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {property.amenities.map((item) => (
                  <View
                    key={item.slug}
                    className="flex-row items-center rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <CheckCircle2 size={14} color={colors.primary} className="mr-2" />
                    <Text className="font-body text-xs text-foreground">{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Availability Notifications & Slide to Apply for students */}
          {!isOwner && (
            <View className="mt-4 gap-4">
              {/* UI-only: no availability-alert endpoint exists yet. */}
              <BellToggle
                offLabel={t('propertyDetail.notifyMe', 'Notify me')}
                onLabel={t('propertyDetail.notifySubscribed', 'Subscribed')}
                color={colors.foreground}
                background={colors.muted}
                onColor={colors.primaryForeground}
                onBackground={colors.primary}
              />

              <SlideCommit
                label={t('propertyDetail.slideToApply', 'Slide to apply')}
                doneLabel={t('propertyDetail.applied', 'Applied!')}
                errorLabel={t('propertyDetail.applicationFailed', 'Application failed')}
                onConfirm={handleApply}
                trackColor={colors.card}
                handleColor={colors.primary}
                successColor={colors.success}
                dangerColor={colors.destructive}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default PropertyDetailScreen;
