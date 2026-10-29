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
      <View className="px-4 py-3 bg-card border-b border-border">
        <Text className="text-h2 font-heading text-foreground">{t('tabs.requests')}</Text>

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
              Booking Applications ({incomingBookings.length})
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
                    className="bg-card rounded-xl border border-border p-4 shadow-elevation-1"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <StatusPill status={booking.status} />
                      <Text className="text-xs font-body text-muted-foreground">
                        {formatIST(booking.createdAt, 'dd MMM yyyy')}
                      </Text>
                    </View>

                    <Text className="text-body font-body-semibold text-foreground mb-0.5">
                      {student?.displayName ?? 'Verified Student'}
                    </Text>

                    <Text className="text-xs font-body text-primary mb-2">
                      {property?.title}
                    </Text>

                    <View className="bg-muted/50 p-2.5 rounded-lg mb-3 gap-1">
                      <View className="flex-row justify-between">
                        <Text className="text-xs font-body text-muted-foreground">Move-in:</Text>
                        <Text className="text-xs font-body-medium text-foreground">
                          {formatIST(booking.moveInDate, 'dd MMM yyyy')}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs font-body text-muted-foreground">Duration:</Text>
                        <Text className="text-xs font-body-medium text-foreground">
                          {booking.durationMonths} months
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs font-body text-muted-foreground">Offered Rent:</Text>
                        <PriceTag paise={booking.agreedRentPaise} size="sm" />
                      </View>
                    </View>

                    {booking.status === 'pending' && (
                      <View className="flex-row gap-2 pt-2 border-t border-border">
                        <TouchableOpacity
                          onPress={() => handleApprove(booking.id)}
                          className="flex-1 bg-primary py-2.5 rounded-lg flex-row items-center justify-center"
                        >
                          <CheckCircle2 size={16} color="white" className="mr-1.5" />
                          <Text className="text-xs font-body-semibold text-primary-foreground">
                            Approve
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleReject(booking.id)}
                          className="px-4 py-2.5 rounded-lg border border-border flex-row items-center justify-center bg-muted/40"
                        >
                          <XCircle size={16} className="text-destructive mr-1.5" />
                          <Text className="text-xs font-body-semibold text-destructive">
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
                  className="bg-card rounded-xl border border-border p-4 shadow-elevation-1"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <StatusPill status={tour.status} />
                    <Text className="text-xs font-body text-muted-foreground">
                      {formatIST(tour.createdAt, 'dd MMM yyyy')}
                    </Text>
                  </View>

                  <Text className="text-body font-body-semibold text-foreground mb-1">
                    {property?.title}
                  </Text>

                  {tour.confirmedSlot ? (
                    <Text className="text-xs font-body text-success">
                      Confirmed for: {formatIST(tour.confirmedSlot, 'dd MMM yyyy, hh:mm a')}
                    </Text>
                  ) : (
                    <Text className="text-xs font-body text-muted-foreground">
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
