import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, MapPin, CheckCircle2 } from 'lucide-react-native';
import { getDB } from '@/api/mock/db';
import { StatusPill } from '@/components/common/status-pill';
import { formatIST } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { colors } from '@/theme/tokens';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = getDB();
  const tour = db.tours.find((t) => t.id === id) ?? db.tours[0]!;
  const property = db.properties.find((p) => p.id === tour.propertyId);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </TouchableOpacity>
        <Text className="font-heading text-body text-foreground">Tour Details</Text>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <StatusPill status={tour.status} />
          <Text className="font-body text-xs text-muted-foreground">
            Requested {formatIST(tour.createdAt, 'dd MMM yyyy')}
          </Text>
        </View>

        <View className="shadow-elevation-1 mb-5 rounded-xl border border-border bg-card p-4">
          <Text className="mb-1 font-heading text-body text-foreground">{property?.title}</Text>
          <View className="flex-row items-center text-muted-foreground">
            <MapPin size={13} className="mr-1 text-muted-foreground" />
            <Text className="font-body text-xs text-muted-foreground">
              {tour.address ?? `${property?.locality}, ${property?.city}`}
            </Text>
          </View>
        </View>

        {tour.confirmedSlot ? (
          <View className="mb-5 rounded-xl border border-success/30 bg-success/10 p-4">
            <View className="mb-1 flex-row items-center">
              <CheckCircle2 size={16} color={colors.success} className="mr-2" />
              <Text className="font-body-semibold text-sm text-success">Tour Confirmed!</Text>
            </View>
            <Text className="font-body text-xs text-foreground">
              Date & Time: {formatIST(tour.confirmedSlot, 'EEEE, dd MMMM yyyy, hh:mm a')}
            </Text>
            <Text className="mt-2 font-body text-xs text-muted-foreground">
              Please arrive 5 minutes before scheduled time. If you need to reschedule, notify the
              owner via chat.
            </Text>
          </View>
        ) : (
          <View className="shadow-elevation-1 mb-5 rounded-xl border border-border bg-card p-4">
            <Text className="mb-2 font-body-semibold text-sm text-foreground">Proposed Slots</Text>
            {tour.proposedSlots.map((slot, index) => (
              <View key={index} className="flex-row items-center border-b border-border/40 py-2">
                <Clock size={14} className="mr-2 text-primary" />
                <Text className="font-body text-xs text-foreground">
                  {formatIST(slot, 'dd MMM yyyy, hh:mm a')}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Button
          onPress={() => toast.info('Tour cancelled')}
          variant="outline"
          size="default"
          className="mt-4 w-full"
        >
          Cancel Tour
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
