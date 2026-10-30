import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, CheckCircle2, XCircle, Calendar } from 'lucide-react-native';
import { getDB } from '@/api/mock/db';
import { StatusPill } from '@/components/common/status-pill';
import { PriceTag } from '@/components/common/price-tag';
import { EmptyState } from '@/components/common/empty-state';
import { formatIST } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';

export default function OwnerRequestsScreen() {
  const { t } = useTranslation();
  const db = getDB();
  const [activeTab, setActiveTab] = useState<'bookings' | 'tours'>('bookings');

  const incomingBookings = db.bookings.filter((b) => b.ownerId === 'owner-1');
  const incomingTours = db.tours.filter((t) => t.ownerId === 'owner-1');

  const handleApprove = (bookingId: string) => {
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (booking) {
      booking.status = 'approved';
      booking.history.push({
        status: 'approved',
        at: new Date().toISOString(),
        by: 'owner-1',
        note: 'Approved by owner',
      });
      toast.success('Booking application approved! Tenant notified.');
    }
  };

  const handleReject = (bookingId: string) => {
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (booking) {
      booking.status = 'rejected';
      booking.history.push({
        status: 'rejected',
        at: new Date().toISOString(),
        by: 'owner-1',
      });
      toast.info('Booking application rejected.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-border bg-card px-4 py-3">
        <Text className="font-heading text-h2 text-foreground">{t('tabs.requests')}</Text>

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
              Booking Applications ({incomingBookings.length})
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
              Tour Requests ({incomingTours.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {activeTab === 'bookings' ? (
          incomingBookings.length === 0 ? (
            <EmptyState
              title="No pending booking applications"
              description="When verified students apply for your rooms, review their move-in details and approve them here."
              icon={ClipboardList}
            />
          ) : (
            <View className="gap-3">
              {incomingBookings.map((booking) => {
                const property = db.properties.find((p) => p.id === booking.propertyId);
                const student = db.users.find((u) => u.id === booking.studentId);

                return (
                  <View
                    key={booking.id}
                    className="shadow-elevation-1 rounded-xl border border-border bg-card p-4"
                  >
                    <View className="mb-2 flex-row items-center justify-between">
                      <StatusPill status={booking.status} />
                      <Text className="font-body text-xs text-muted-foreground">
                        {formatIST(booking.createdAt, 'dd MMM yyyy')}
                      </Text>
                    </View>

                    <Text className="mb-0.5 font-body-semibold text-body text-foreground">
                      {student?.displayName ?? 'Verified Student'}
                    </Text>

                    <Text className="mb-2 font-body text-xs text-primary">{property?.title}</Text>

                    <View className="mb-3 gap-1 rounded-lg bg-muted/50 p-2.5">
                      <View className="flex-row justify-between">
                        <Text className="font-body text-xs text-muted-foreground">Move-in:</Text>
                        <Text className="font-body-medium text-xs text-foreground">
                          {formatIST(booking.moveInDate, 'dd MMM yyyy')}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="font-body text-xs text-muted-foreground">Duration:</Text>
                        <Text className="font-body-medium text-xs text-foreground">
                          {booking.durationMonths} months
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="font-body text-xs text-muted-foreground">
                          Offered Rent:
                        </Text>
                        <PriceTag paise={booking.agreedRentPaise} size="sm" />
                      </View>
                    </View>

                    {booking.status === 'pending' && (
                      <View className="flex-row gap-2 border-t border-border pt-2">
                        <TouchableOpacity
                          onPress={() => handleApprove(booking.id)}
                          className="flex-1 flex-row items-center justify-center rounded-lg bg-primary py-2.5"
                        >
                          <CheckCircle2 size={16} color="white" className="mr-1.5" />
                          <Text className="font-body-semibold text-xs text-primary-foreground">
                            Approve
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleReject(booking.id)}
                          className="flex-row items-center justify-center rounded-lg border border-border bg-muted/40 px-4 py-2.5"
                        >
                          <XCircle size={16} className="mr-1.5 text-destructive" />
                          <Text className="font-body-semibold text-xs text-destructive">
                            Decline
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )
        ) : incomingTours.length === 0 ? (
          <EmptyState
            title="No tour requests"
            description="Students interested in visiting your properties will request slots here."
            icon={Calendar}
          />
        ) : (
          <View className="gap-3">
            {incomingTours.map((tour) => {
              const property = db.properties.find((p) => p.id === tour.propertyId);
              return (
                <View
                  key={tour.id}
                  className="shadow-elevation-1 rounded-xl border border-border bg-card p-4"
                >
                  <View className="mb-2 flex-row items-center justify-between">
                    <StatusPill status={tour.status} />
                    <Text className="font-body text-xs text-muted-foreground">
                      {formatIST(tour.createdAt, 'dd MMM yyyy')}
                    </Text>
                  </View>

                  <Text className="mb-1 font-body-semibold text-body text-foreground">
                    {property?.title}
                  </Text>

                  {tour.confirmedSlot ? (
                    <Text className="font-body text-xs text-success">
                      Confirmed for: {formatIST(tour.confirmedSlot, 'dd MMM yyyy, hh:mm a')}
                    </Text>
                  ) : (
                    <Text className="font-body text-xs text-muted-foreground">
                      Slots proposed: {tour.proposedSlots.length}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
