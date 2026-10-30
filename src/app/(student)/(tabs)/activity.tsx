import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CalendarClock, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { getDB } from '@/api/mock/db';
import { StatusPill } from '@/components/common/status-pill';
import { PriceTag } from '@/components/common/price-tag';
import { EmptyState } from '@/components/common/empty-state';
import { formatIST } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/tokens';

export default function ActivityScreen() {
  const { t } = useTranslation();
  const db = getDB();
  const [activeTab, setActiveTab] = useState<'bookings' | 'tours'>('bookings');

  const bookings = db.bookings;
  const tours = db.tours;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-border bg-card px-4 py-3">
        <Text className="font-heading text-h2 text-foreground">{t('tabs.activity')}</Text>

        {/* Segmented Control */}
        <View className="mt-3 flex-row rounded-xl bg-muted p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('bookings')}
            className={cn(
              'flex-1 items-center rounded-lg py-2',
              activeTab === 'bookings' ? 'shadow-elevation-1 bg-card' : 'bg-transparent',
            )}
          >
            <Text
              className={cn(
                'font-body-semibold text-xs',
                activeTab === 'bookings' ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              Bookings ({bookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('tours')}
            className={cn(
              'flex-1 items-center rounded-lg py-2',
              activeTab === 'tours' ? 'shadow-elevation-1 bg-card' : 'bg-transparent',
            )}
          >
            <Text
              className={cn(
                'font-body-semibold text-xs',
                activeTab === 'tours' ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              Tours ({tours.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {activeTab === 'bookings' ? (
          bookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="When you apply to book a verified room, track your application timeline here."
              actionLabel="Find a Room"
              onAction={() => router.push('/(student)/(tabs)/explore')}
              icon={CalendarClock}
            />
          ) : (
            <View className="gap-3">
              {bookings.map((booking) => {
                const property = db.properties.find((p) => p.id === booking.propertyId);
                return (
                  <TouchableOpacity
                    key={booking.id}
                    onPress={() => router.push(`/booking/${booking.id}`)}
                    className="shadow-elevation-1 rounded-xl border border-border bg-card p-4"
                    activeOpacity={0.8}
                  >
                    <View className="mb-2 flex-row items-center justify-between">
                      <StatusPill status={booking.status} />
                      <Text className="font-body text-xs text-muted-foreground">
                        {formatIST(booking.createdAt, 'dd MMM yyyy')}
                      </Text>
                    </View>

                    <Text className="mb-1 font-body-semibold text-body text-foreground">
                      {property?.title ?? 'Student Room'}
                    </Text>

                    <View className="mb-3 flex-row items-center text-muted-foreground">
                      <MapPin size={13} className="mr-1 text-muted-foreground" />
                      <Text className="font-body text-xs text-muted-foreground">
                        {property?.locality}, {property?.city}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between border-t border-border/60 pt-3">
                      <PriceTag paise={booking.agreedRentPaise} size="sm" />
                      <View className="flex-row items-center">
                        <Text className="mr-1 font-body-medium text-xs text-primary">
                          View Timeline
                        </Text>
                        <ChevronRight size={14} color={colors.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        ) : tours.length === 0 ? (
          <EmptyState
            title="No scheduled tours"
            description="Request a physical or virtual tour from any property page to visit before booking."
            actionLabel="Explore Rooms"
            onAction={() => router.push('/(student)/(tabs)/explore')}
            icon={Calendar}
          />
        ) : (
          <View className="gap-3">
            {tours.map((tour) => {
              const property = db.properties.find((p) => p.id === tour.propertyId);
              return (
                <TouchableOpacity
                  key={tour.id}
                  onPress={() => router.push(`/tour/${tour.id}`)}
                  className="shadow-elevation-1 rounded-xl border border-border bg-card p-4"
                  activeOpacity={0.8}
                >
                  <View className="mb-2 flex-row items-center justify-between">
                    <StatusPill status={tour.status} />
                    <Text className="font-body text-xs text-muted-foreground">
                      {formatIST(tour.createdAt, 'dd MMM yyyy')}
                    </Text>
                  </View>

                  <Text className="mb-1 font-body-semibold text-body text-foreground">
                    {property?.title ?? 'Student Room Tour'}
                  </Text>

                  {tour.confirmedSlot && (
                    <View className="mb-2 mt-2 flex-row items-center rounded-lg bg-muted/60 p-2">
                      <Clock size={14} className="mr-2 text-primary" />
                      <Text className="font-body-medium text-xs text-foreground">
                        Confirmed: {formatIST(tour.confirmedSlot, 'dd MMM yyyy, hh:mm a')}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between pt-2">
                    <Text className="font-body text-xs text-muted-foreground">
                      {tour.address ?? `${property?.locality}, ${property?.city}`}
                    </Text>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
