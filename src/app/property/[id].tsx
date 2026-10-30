import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react-native';
import { getDB, addFavorite, removeFavorite } from '@/api/mock/db';
import { PriceTag } from '@/components/common/price-tag';
import { Button } from '@/components/ui/button';
import { Image } from 'expo-image';
import { toast } from '@/components/ui/toast';
import { colors } from '@/theme/tokens';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = getDB();
  const property = db.properties.find((p) => p.id === id) ?? db.properties[0]!;
  const owner = db.users.find((u) => u.id === property.ownerId);

  const [isFavorite, setIsFavorite] = React.useState(db.favorites.includes(property.id));

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFavorite(property.id);
      setIsFavorite(false);
      toast.info('Removed from saved properties');
    } else {
      addFavorite(property.id);
      setIsFavorite(true);
      toast.success('Saved to your favorites!');
    }
  };

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

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={toggleFavorite}
            className="h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-md"
          >
            <Heart
              size={20}
              color={isFavorite ? colors.destructive : colors.foreground}
              fill={isFavorite ? colors.destructive : 'transparent'}
            />
          </TouchableOpacity>
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

          {/* Owner Trust Badge */}
          <View className="mb-5 flex-row items-center rounded-xl border border-border bg-muted/40 p-4">
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

      {/* Sticky Bottom CTA Bar */}
      <View className="shadow-elevation-2 absolute bottom-0 left-0 right-0 flex-row items-center gap-3 border-t border-border bg-card p-4">
        <TouchableOpacity
          onPress={() => router.push(`/chat/inquiry-1`)}
          className="h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/50"
          accessibilityLabel="Message owner"
        >
          <MessageSquare size={20} className="text-foreground" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toast.info('Tour booking opens in Phase M3')}
          className="flex-1 items-center justify-center rounded-xl border border-border bg-muted/60 py-3.5"
        >
          <Text className="font-body-semibold text-xs text-foreground">Request Tour</Text>
        </TouchableOpacity>

        <Button
          onPress={() => toast.success('Application flow launches in Transact Phase')}
          size="default"
          className="flex-1 py-3.5"
        >
          <Text className="font-body-semibold text-xs text-primary-foreground">Apply to Book</Text>
        </Button>
      </View>
    </View>
  );
}
