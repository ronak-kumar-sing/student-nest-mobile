import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react-native';
import { getDB, addFavorite, removeFavorite } from '@/api/mock/db';
import { PriceTag } from '@/components/common/price-tag';
import { PulseHeart } from '@/components/common/pulse-heart';
import { BellToggle } from '@/components/common/bell-toggle';
import { SlideCommit } from '@/components/common/slide-commit';
import { PeekRating } from '@/components/common/peek-rating';
import { SpotlightCard } from '@/components/common/spotlight-card';
import { Image } from 'expo-image';
import { toast } from '@/components/ui/toast';
import { colors } from '@/theme/tokens';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const db = getDB();
  const property = db.properties.find((p) => p.id === id) ?? db.properties[0]!;
  const owner = db.users.find((u) => u.id === property.ownerId);

  const [isFavorite, setIsFavorite] = React.useState(db.favorites.includes(property.id));

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
        >
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          <PulseHeart
            liked={isFavorite}
            size={40}
            corner={20}
            likedColor="#EF4444"
            pillColor="rgba(255, 255, 255, 0.88)"
            onChange={(liked) => {
              if (liked) {
                addFavorite(property.id);
                setIsFavorite(true);
                toast.success('Saved to your favorites!');
              } else {
                removeFavorite(property.id);
                setIsFavorite(false);
                toast.info('Removed from saved properties');
              }
            }}
          />
          <TouchableOpacity
            onPress={() => toast.info('Link copied to clipboard')}
            className="h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-md"
          >
            <Share2 size={20} className="text-foreground" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image Gallery */}
        <View className="h-72 w-full bg-muted">
          <Image
            source={{ uri: property.images[0] }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </View>

        <View className="p-4">
          {/* Price Block */}
          <View className="mb-2 flex-row items-baseline justify-between">
            <PriceTag paise={property.rentPaise} size="lg" />
            <View className="rounded-md bg-primary/10 px-2.5 py-1">
              <Text className="font-body-semibold text-xs capitalize text-primary">
                {property.roomType.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text className="mb-2 font-heading text-h3 text-foreground">{property.title}</Text>

          <View className="mb-4 flex-row items-center text-muted-foreground">
            <MapPin size={14} className="mr-1 text-muted-foreground" />
            <Text className="font-body text-sm text-muted-foreground">
              {property.locality}, {property.city} (Exact address revealed after approval)
            </Text>
          </View>

          {/* Deposit & Bills breakdown */}
          <View className="shadow-elevation-1 mb-5 flex-row justify-around rounded-xl border border-border bg-card p-3.5">
            <View className="items-center">
              <Text className="font-body text-xs text-muted-foreground">Security Deposit</Text>
              <Text className="mt-0.5 font-body-semibold text-sm text-foreground">
                ₹{property.depositPaise / 100}
              </Text>
            </View>
            <View className="w-[1px] bg-border" />
            <View className="items-center">
              <Text className="font-body text-xs text-muted-foreground">Maintenance</Text>
              <Text className="mt-0.5 font-body-semibold text-sm text-foreground">
                {property.maintenancePaise > 0 ? `₹${property.maintenancePaise / 100}` : 'Included'}
              </Text>
            </View>
            <View className="w-[1px] bg-border" />
            <View className="items-center">
              <Text className="font-body text-xs text-muted-foreground">Gender Policy</Text>
              <Text className="mt-0.5 font-body-semibold text-sm capitalize text-foreground">
                {property.genderPolicy}
              </Text>
            </View>
          </View>

          {/* Owner Trust Badge with SpotlightCard */}
          <View className="mb-5">
            <SpotlightCard
              theme="light"
              spotlightColor="#10B981"
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
                      {owner?.displayName ?? 'Verified Owner'}
                    </Text>
                    <View className="py-0.2 rounded bg-success/15 px-1.5">
                      <Text className="text-[10px] font-bold text-success">VERIFIED</Text>
                    </View>
                  </View>
                  <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                    Government KYC Verified • High response rate (98%)
                  </Text>
                </View>
              </View>
            </SpotlightCard>
          </View>

          {/* Availability Notifications with BellToggle */}
          <View className="mb-5 flex-row items-center justify-between rounded-xl border border-border bg-card p-3.5">
            <View className="flex-1 pr-3">
              <Text className="font-body-semibold text-sm text-foreground">Room Availability Alert</Text>
              <Text className="font-body text-xs text-muted-foreground">
                Get instant notification if a vacancy opens
              </Text>
            </View>
            <BellToggle
              size="sm"
              offLabel="Notify me"
              onLabel="Subscribed"
              radius={16}
              onBackground="#10B981"
              onColor="#FFFFFF"
              onChange={(active) => {
                if (active) toast.success('Subscribed to room vacancy alerts!');
                else toast.info('Alerts unsubscribed');
              }}
            />
          </View>

          {/* Student Reviews with PeekRating */}
          <View className="mb-5 rounded-xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-heading text-sm text-foreground">Student Rating</Text>
              <Text className="font-body-semibold text-xs text-foreground">★ {property.rating} ({property.reviewCount} reviews)</Text>
            </View>
            <View className="items-center py-2 bg-muted/40 rounded-lg">
              <PeekRating
                value={Math.round(property.rating)}
                count={5}
                size={24}
                readOnly={true}
                showTip={false}
                activeColor="#F59E0B"
                idleColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Amenities Grid */}
          <View className="mb-6">
            <Text className="mb-3 font-heading text-body text-foreground">Amenities</Text>
            <View className="flex-row flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <View
                  key={amenity}
                  className="flex-row items-center rounded-lg border border-border bg-card px-3 py-2"
                >
                  <CheckCircle2 size={14} color={colors.success} className="mr-1.5" />
                  <Text className="font-body text-xs text-foreground">{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Nearby Colleges */}
          <View className="mb-6">
            <Text className="mb-3 font-heading text-body text-foreground">
              Nearby Colleges & Landmarks
            </Text>
            <View className="gap-2">
              {property.nearbyColleges.map((college) => (
                <View key={college} className="flex-row items-center rounded-lg bg-muted/50 p-2.5">
                  <MapPin size={14} className="mr-2 text-primary" />
                  <Text className="font-body text-xs text-foreground">{college}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA Bar with SlideCommit */}
      <View
        style={{ paddingBottom: Math.max(14, insets.bottom), paddingTop: 12 }}
        className="shadow-elevation-2 absolute bottom-0 left-0 right-0 flex-row items-center gap-3 border-t border-border bg-card px-4"
      >
        <TouchableOpacity
          onPress={() => router.push(`/chat/inquiry-1`)}
          className="h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/50"
          accessibilityLabel="Message owner"
        >
          <MessageSquare size={20} className="text-foreground" />
        </TouchableOpacity>

        <View className="flex-1">
          <SlideCommit
            label="Slide to Apply"
            doneLabel="Application Sent!"
            errorLabel="Failed to apply"
            height={50}
            radius={25}
            trackColor="#111827"
            handleColor="#FFFFFF"
            successColor="#10B981"
            onConfirm={async () => {
              await new Promise((res) => setTimeout(res, 450));
              const database = getDB();
              const newBooking = {
                id: `booking-${Date.now()}`,
                propertyId: property.id,
                studentId: 'student-1',
                ownerId: property.ownerId,
                status: 'pending' as const,
                moveInDate: new Date(Date.now() + 7 * 86400000).toISOString(),
                durationMonths: 6,
                occupants: 1,
                agreedRentPaise: property.rentPaise,
                createdAt: new Date().toISOString(),
                history: [
                  {
                    status: 'pending',
                    at: new Date().toISOString(),
                    by: 'student-1',
                    note: 'Applied directly through verified listing',
                  },
                ],
              };
              database.bookings.unshift(newBooking);
              toast.success('Your booking request was submitted to the owner!');
            }}
          />
        </View>
      </View>
    </View>
  );
}
