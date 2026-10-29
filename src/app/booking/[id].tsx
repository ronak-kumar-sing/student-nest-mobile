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

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = getDB();
  const booking = db.bookings.find((b) => b.id === id) ?? db.bookings[0]!;
  const property = db.properties.find((p) => p.id === booking.propertyId);
  const owner = db.users.find((u) => u.id === booking.ownerId);

  const isApproved = booking.status === 'approved';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-body font-heading text-foreground">Booking Details</Text>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <StatusPill status={booking.status} />
          <Text className="text-xs font-body text-muted-foreground">
            Created on {formatIST(booking.createdAt, 'dd MMM yyyy')}
          </Text>
        </View>

        {/* Property Summary */}
        <View className="bg-card border border-border p-4 rounded-xl mb-5 shadow-elevation-1">
          <Text className="text-body font-heading text-foreground mb-1">
            {property?.title}
          </Text>
          <PriceTag paise={booking.agreedRentPaise} size="default" />
        </View>

        {/* Contact and Address Reveal Rules (Backend Spec §7 & §07) */}
        {isApproved ? (
          <View className="bg-success/10 border border-success/30 p-4 rounded-xl mb-5">
            <View className="flex-row items-center mb-2">
              <ShieldCheck size={18} color="hsl(var(--success))" className="mr-2" />
              <Text className="text-sm font-body-semibold text-success">
                Contact & Exact Address Revealed
              </Text>
            </View>
            <View className="gap-2 mt-2">
              <View className="flex-row items-center">
                <MapPin size={14} className="text-foreground mr-2" />
                <Text className="text-xs font-body text-foreground">
                  {property?.address ?? 'House #100, Vijay Nagar, Indore'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Phone size={14} className="text-foreground mr-2" />
                <Text className="text-xs font-body text-foreground">
                  Owner Phone: {owner?.phone ?? '+91 98765 43212'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="bg-muted/60 border border-border p-4 rounded-xl mb-5">
            <Text className="text-xs font-body text-muted-foreground">
              🔒 The owner&apos;s direct contact phone number and exact street address will be unlocked once this booking application is approved.
            </Text>
          </View>
        )}

        {/* Status History Timeline */}
        <View className="mb-6">
          <Text className="text-body font-heading text-foreground mb-3">
            Application Timeline
          </Text>
          <View className="bg-card border border-border p-4 rounded-xl gap-4 shadow-elevation-1">
            {booking.history.map((entry, index) => (
              <View key={index} className="flex-row items-start">
                <View className="h-6 w-6 rounded-full bg-primary/10 items-center justify-center mr-3 mt-0.5">
                  <CheckCircle2 size={14} color="hsl(var(--primary))" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-body-semibold text-foreground capitalize">
                    {entry.status.replace('_', ' ')}
                  </Text>
                  <Text className="text-[11px] font-body text-muted-foreground">
                    {formatIST(entry.at, 'dd MMM yyyy, hh:mm a')}
                  </Text>
                  {entry.note && (
                    <Text className="text-xs font-body text-foreground mt-1 bg-muted/60 p-2 rounded">
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
