import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { getDB } from '@/api/mock/db';
import { StatusPill } from '@/components/common/status-pill';
import { PriceTag } from '@/components/common/price-tag';
import { formatIST } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { colors } from '@/theme/tokens';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = getDB();
  const booking = db.bookings.find((b) => b.id === id) ?? db.bookings[0]!;
  const property = db.properties.find((p) => p.id === booking.propertyId);
  const owner = db.users.find((u) => u.id === booking.ownerId);

  const isApproved = booking.status === 'approved';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </TouchableOpacity>
        <Text className="font-heading text-body text-foreground">Booking Details</Text>
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
          <Text className="mb-1 font-heading text-body text-foreground">{property?.title}</Text>
          <PriceTag paise={booking.agreedRentPaise} size="default" />
        </View>

        {/* Contact and Address Reveal Rules (Backend Spec §7 & §07) */}
        {isApproved ? (
          <View className="mb-5 rounded-xl border border-success/30 bg-success/10 p-4">
            <View className="mb-2 flex-row items-center">
              <ShieldCheck size={18} color={colors.success} className="mr-2" />
              <Text className="font-body-semibold text-sm text-success">
                Contact & Exact Address Revealed
              </Text>
            </View>
            <View className="mt-2 gap-2">
              <View className="flex-row items-center">
                <MapPin size={14} className="mr-2 text-foreground" />
                <Text className="font-body text-xs text-foreground">
                  {property?.address ?? 'House #100, Vijay Nagar, Indore'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Phone size={14} className="mr-2 text-foreground" />
                <Text className="font-body text-xs text-foreground">
                  Owner Phone: {owner?.phone ?? '+91 98765 43212'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="mb-5 rounded-xl border border-border bg-muted/60 p-4">
            <Text className="font-body text-xs text-muted-foreground">
              🔒 The owner&apos;s direct contact phone number and exact street address will be
              unlocked once this booking application is approved.
            </Text>
          </View>
        )}

        {/* Status History Timeline */}
        <View className="mb-6">
          <Text className="mb-3 font-heading text-body text-foreground">Application Timeline</Text>
          <View className="shadow-elevation-1 gap-4 rounded-xl border border-border bg-card p-4">
            {booking.history.map((entry, index) => (
              <View key={index} className="flex-row items-start">
                <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 size={14} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-body-semibold text-xs capitalize text-foreground">
                    {entry.status.replace('_', ' ')}
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
            onPress={() => toast.info('Booking application withdrawn')}
            variant="destructive"
            size="default"
            className="w-full"
          >
            Withdraw Application
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
