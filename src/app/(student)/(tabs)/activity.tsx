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

export default function ActivityScreen() {
  const { t } = useTranslation();
  const db = getDB();
  const [activeTab, setActiveTab] = useState<'bookings' | 'tours'>('bookings');

  const bookings = db.bookings;
  const tours = db.tours;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-3 bg-card border-b border-border">
        <Text className="text-h2 font-heading text-foreground">{t('tabs.activity')}</Text>

        {/* Segmented Control */}
        <View className="flex-row bg-muted p-1 rounded-xl mt-3">
          <TouchableOpacity
            onPress={() => setActiveTab('bookings')}
            className={cn(
              'flex-1 py-2 rounded-lg items-center',
              activeTab === 'bookings' ? 'bg-card shadow-elevation-1' : '',
            )}
          >
            <Text
              className={cn(
                'text-xs font-body-semibold',
                activeTab === 'bookings' ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              Bookings ({bookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('tours')}
            className={cn(
              'flex-1 py-2 rounded-lg items-center',
              activeTab === 'tours' ? 'bg-card shadow-elevation-1' : '',
            )}
          >
            <Text
              className={cn(
                'text-xs font-body-semibold',
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
                    className="bg-card rounded-xl border border-border p-4 shadow-elevation-1"
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <StatusPill status={booking.status} />
                      <Text className="text-xs font-body text-muted-foreground">
                        {formatIST(booking.createdAt, 'dd MMM yyyy')}
                      </Text>
                    </View>

                    <Text className="text-body font-body-semibold text-foreground mb-1">
                      {property?.title ?? 'Student Room'}
                    </Text>

                    <View className="flex-row items-center text-muted-foreground mb-3">
                      <MapPin size={13} className="text-muted-foreground mr-1" />
                      <Text className="text-xs font-body text-muted-foreground">
                        {property?.locality}, {property?.city}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between pt-3 border-t border-border/60">
                      <PriceTag paise={booking.agreedRentPaise} size="sm" />
                      <View className="flex-row items-center">
                        <Text className="text-xs font-body-medium text-primary mr-1">
                          View Timeline
                        </Text>
                        <ChevronRight size={14} color="hsl(var(--primary))" />
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
                  className="bg-card rounded-xl border border-border p-4 shadow-elevation-1"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <StatusPill status={tour.status} />
                    <Text className="text-xs font-body text-muted-foreground">
                      {formatIST(tour.createdAt, 'dd MMM yyyy')}
                    </Text>
                  </View>

                  <Text className="text-body font-body-semibold text-foreground mb-1">
                    {property?.title ?? 'Student Room Tour'}
                  </Text>

                  {tour.confirmedSlot && (
                    <View className="flex-row items-center bg-muted/60 p-2 rounded-lg mt-2 mb-2">
                      <Clock size={14} className="text-primary mr-2" />
                      <Text className="text-xs font-body-medium text-foreground">
                        Confirmed: {formatIST(tour.confirmedSlot, 'dd MMM yyyy, hh:mm a')}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between pt-2">
                    <Text className="text-xs font-body text-muted-foreground">
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
