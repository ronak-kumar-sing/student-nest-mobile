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

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = getDB();
  const tour = db.tours.find((t) => t.id === id) ?? db.tours[0]!;
  const property = db.properties.find((p) => p.id === tour.propertyId);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-body font-heading text-foreground">Tour Details</Text>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <StatusPill status={tour.status} />
          <Text className="text-xs font-body text-muted-foreground">
            Requested {formatIST(tour.createdAt, 'dd MMM yyyy')}
          </Text>
        </View>

        <View className="bg-card border border-border p-4 rounded-xl mb-5 shadow-elevation-1">
          <Text className="text-body font-heading text-foreground mb-1">
            {property?.title}
          </Text>
          <View className="flex-row items-center text-muted-foreground">
            <MapPin size={13} className="text-muted-foreground mr-1" />
            <Text className="text-xs font-body text-muted-foreground">
              {tour.address ?? `${property?.locality}, ${property?.city}`}
            </Text>
          </View>
        </View>

        {tour.confirmedSlot ? (
          <View className="bg-success/10 border border-success/30 p-4 rounded-xl mb-5">
            <View className="flex-row items-center mb-1">
              <CheckCircle2 size={16} color="hsl(var(--success))" className="mr-2" />
              <Text className="text-sm font-body-semibold text-success">Tour Confirmed!</Text>
            </View>
            <Text className="text-xs font-body text-foreground">
              Date & Time: {formatIST(tour.confirmedSlot, 'EEEE, dd MMMM yyyy, hh:mm a')}
            </Text>
            <Text className="text-xs font-body text-muted-foreground mt-2">
              Please arrive 5 minutes before scheduled time. If you need to reschedule, notify the owner via chat.
            </Text>
          </View>
        ) : (
          <View className="bg-card border border-border p-4 rounded-xl mb-5 shadow-elevation-1">
            <Text className="text-sm font-body-semibold text-foreground mb-2">
              Proposed Slots
            </Text>
            {tour.proposedSlots.map((slot, index) => (
              <View key={index} className="flex-row items-center py-2 border-b border-border/40">
                <Clock size={14} className="text-primary mr-2" />
                <Text className="text-xs font-body text-foreground">
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
          className="w-full mt-4"
        >
          Cancel Tour
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
