import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Phone, ShieldCheck, CheckCircle2, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StatusPill } from '@/components/common/status-pill';
import { PriceTag } from '@/components/common/price-tag';
import { ErrorState } from '@/components/common/error-state';
import { BookingCardSkeleton } from '@/components/common/list-skeletons';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { formatIST } from '@/lib/dates';
import { useThemeColors } from '@/theme/use-theme-colors';
import { getErrorCode } from '@/api/errors';
import { useBookingActionMutation, useBookingQuery } from '../queries';
import { bookingDtoToViewModel } from '../mappers';

export function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const colors = useThemeColors();

  const { data: rawBooking, isLoading, isError, error, refetch } = useBookingQuery(id ?? '');
  const actionMutation = useBookingActionMutation();

  const booking = useMemo(() => {
    return rawBooking ? bookingDtoToViewModel(rawBooking) : null;
  }, [rawBooking]);

  const handleWithdraw = async () => {
    if (!booking) return;
    try {
      await actionMutation.mutateAsync({
        id: booking.id,
        action: {
          action: 'withdraw',
          note: 'Withdrawn by student',
        },
      });
      toast.info(t('bookings.withdrawnSuccess', 'Booking application withdrawn'));
    } catch {
      // Error is handled in mutation onError
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="border-b border-border bg-card px-4 py-3">
          <Text className="font-heading text-body text-foreground">
            {t('bookings.title', 'Booking Details')}
          </Text>
        </View>
        <View className="p-4 gap-4">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full bg-muted"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="font-heading text-body text-foreground">
            {t('bookings.title', 'Booking Details')}
          </Text>
          <View className="w-9" />
        </View>
        <ErrorState code={getErrorCode(error)} onRetry={() => refetch()} className="flex-1" />
      </SafeAreaView>
    );
  }

  if (!booking) return null;

  const isApprovedOrActive =
    booking.status === 'approved' ||
    booking.status === 'checked_in' ||
    booking.status === 'completed';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="font-heading text-body text-foreground">
          {t('bookings.title', 'Booking Details')}
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <StatusPill status={booking.status} />
          <Text className="font-body text-xs text-muted-foreground">
            Created on {formatIST(booking.createdAt, 'dd MMM yyyy')}
          </Text>
        </View>

        {/* Property Summary */}
        <View className="shadow-elevation-1 mb-5 rounded-xl border border-border bg-card p-4">
          <Text className="mb-1 font-heading text-body text-foreground">
            {booking.propertyTitle}
          </Text>
          <View className="mb-2 flex-row items-center text-muted-foreground">
            <MapPin size={13} color={colors.mutedForeground} className="mr-1" />
            <Text className="font-body text-xs text-muted-foreground">
              {booking.locality}, {booking.citySlug}
            </Text>
          </View>
          <PriceTag paise={booking.agreedRentPaise} size="default" />
        </View>

        {/* Move-in and Stay info */}
        <View className="mb-5 rounded-xl border border-border bg-card p-4">
          <View className="flex-row justify-between mb-2">
            <Text className="font-body text-xs text-muted-foreground">Move-in Date</Text>
            <Text className="font-body-semibold text-xs text-foreground">
              {booking.moveInDate}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-body text-xs text-muted-foreground">Duration</Text>
            <Text className="font-body-semibold text-xs text-foreground">
              {booking.durationMonths} months
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-body text-xs text-muted-foreground">Occupants</Text>
            <Text className="font-body-semibold text-xs text-foreground">
              {booking.occupants} person
            </Text>
          </View>
        </View>

        {/* Contact and Address Reveal Rules (Backend Spec §7 & §07) */}
        {isApprovedOrActive && (booking.contact || booking.address) ? (
          <View className="mb-5 rounded-xl border border-success/30 bg-success/10 p-4">
            <View className="mb-2 flex-row items-center">
              <ShieldCheck size={18} color={colors.success} className="mr-2" />
              <Text className="font-body-semibold text-sm text-success">
                {t('bookings.revealNoticeUnlocked', 'Contact & Exact Address Revealed')}
              </Text>
            </View>
            <View className="mt-2 gap-2">
              {booking.address && (
                <View className="flex-row items-center">
                  <MapPin size={14} color={colors.foreground} className="mr-2" />
                  <Text className="font-body text-xs text-foreground">
                    {booking.address.line1
                      ? `${booking.address.line1}, ${booking.address.locality}, ${booking.address.city}`
                      : `${booking.address.locality}, ${booking.address.city}`}
                  </Text>
                </View>
              )}
              {booking.contact?.phone && (
                <View className="flex-row items-center">
                  <Phone size={14} color={colors.foreground} className="mr-2" />
                  <Text className="font-body text-xs text-foreground">
                    {t('bookings.ownerPhone', 'Owner Phone')}: {booking.contact.phone}
                  </Text>
                </View>
              )}
              {booking.contact?.email && (
                <View className="flex-row items-center">
                  <Mail size={14} color={colors.foreground} className="mr-2" />
                  <Text className="font-body text-xs text-foreground">
                    {t('bookings.ownerEmail', 'Owner Email')}: {booking.contact.email}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="mb-5 rounded-xl border border-border bg-muted/60 p-4">
            <Text className="font-body text-xs text-muted-foreground">
              {t(
                'bookings.revealNoticeLocked',
                "🔒 The owner's direct contact phone number and exact street address will be unlocked once this booking application is approved.",
              )}
            </Text>
          </View>
        )}

        {/* Status History Timeline */}
        <View className="mb-6">
          <Text className="mb-3 font-heading text-body text-foreground">
            {t('bookings.applicationTimeline', 'Application Timeline')}
          </Text>
          <View className="shadow-elevation-1 gap-4 rounded-xl border border-border bg-card p-4">
            {booking.history.map((entry, index) => (
              <View key={index} className="flex-row items-start">
                <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 size={14} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-body-semibold text-xs capitalize text-foreground">
                    {entry.statusLabel}
                  </Text>
                  <Text className="font-body text-[11px] text-muted-foreground">
                    {formatIST(entry.at, 'dd MMM yyyy, hh:mm a')}
                  </Text>
                  {entry.note && (
                    <Text className="mt-1 rounded bg-muted/60 p-2 font-body text-xs text-foreground">
                      &ldquo;{entry.note}&rdquo;
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {booking.status === 'pending' && (
          <Button
            onPress={handleWithdraw}
            variant="destructive"
            size="default"
            className="w-full"
            disabled={actionMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Withdraw booking application"
          >
            {t('bookings.withdraw', 'Withdraw Application')}
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default BookingDetailScreen;
