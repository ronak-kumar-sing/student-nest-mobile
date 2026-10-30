import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, SlidersHorizontal, MapPin, Wrench, Users } from 'lucide-react-native';
import { getDB, MockProperty } from '@/api/mock/db';
import { PriceTag } from '@/components/common/price-tag';
import { TiltedCard } from '@/components/common/tilted-card';
import { Chip } from '@/components/ui/chip';
import { colors } from '@/theme/tokens';

export default function ExploreScreen() {
  const db = getDB();
  const [selectedCity, setSelectedCity] = useState<'All' | 'Indore' | 'Bengaluru' | 'Pune'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProperties = db.properties.filter((p) => {
    if (selectedCity !== 'All' && p.city !== selectedCity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.locality.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header with Search and Dev Menu */}
      <View className="border-b border-border bg-card px-4 pb-3 pt-2">
        <View className="mb-3 flex-row items-center justify-between">
          <View>
            <Text className="font-heading text-h2 text-foreground">Find Your Nest</Text>
            <Text className="font-body text-xs text-muted-foreground">
              Direct from verified owners • 0% Brokerage
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/dev')}
            className="flex-row items-center rounded-full bg-muted/80 px-2.5 py-1.5"
            accessibilityLabel="Open Dev Menu"
          >
            <Wrench size={13} className="mr-1 text-muted-foreground" />
            <Text className="font-body-medium text-xs text-muted-foreground">Dev</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center rounded-xl border border-border bg-muted/70 px-3 py-2">
          <Search size={18} className="mr-2 text-muted-foreground" />
          <TextInput
            placeholder="Search locality, college, city..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 p-0 font-body text-sm text-foreground"
          />
          <TouchableOpacity className="p-1">
            <SlidersHorizontal size={16} className="text-foreground" />
          </TouchableOpacity>
        </View>

        {/* City Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 flex-row gap-2"
        >
          {(['All', 'Indore', 'Bengaluru', 'Pune'] as const).map((city) => (
            <Chip
              key={city}
              label={city}
              selected={selectedCity === city}
              onPress={() => setSelectedCity(city)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Property List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-body-semibold text-sm text-foreground">
            {filteredProperties.length} Verified Rooms Available
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(student)/(tabs)/activity')}
            className="flex-row items-center"
          >
            <Users size={14} color={colors.primary} className="mr-1" />
            <Text className="font-body-semibold text-xs text-primary">Find Roommates</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-4">
          {filteredProperties.slice(0, 15).map((property: MockProperty, idx: number) => (
            <TiltedCard
              key={property.id}
              imageSrc={property.images[0]}
              captionText={`★ ${property.rating} (${property.reviewCount})`}
              imageHeight={185}
              radius={18}
              rotateAmplitude={14}
              index={idx}
              onClick={() => router.push(`/property/${property.id}`)}
            >
              {/* Info Block */}
              <View className="p-3.5 bg-card">
                <View className="mb-1 flex-row items-center justify-between">
                  <PriceTag paise={property.rentPaise} size="default" />
                  <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
                    <Text className="font-body-semibold text-[11px] capitalize text-primary">
                      {property.roomType.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Text
                  className="mb-1.5 font-body-semibold text-body text-foreground"
                  numberOfLines={1}
                >
                  {property.title}
                </Text>

                <View className="mb-2 flex-row items-center text-muted-foreground">
                  <MapPin size={13} className="mr-1 text-muted-foreground" />
                  <Text className="font-body text-xs text-muted-foreground">
                    {property.locality}, {property.city}
                  </Text>
                </View>

                {/* Amenities pills */}
                <View className="flex-row flex-wrap gap-1.5 border-t border-border/60 pt-2">
                  {property.amenities.slice(0, 3).map((amenity) => (
                    <View key={amenity} className="rounded bg-muted px-2 py-0.5">
                      <Text className="font-body text-xs text-muted-foreground">{amenity}</Text>
                    </View>
                  ))}
                  {property.amenities.length > 3 && (
                    <Text className="self-center font-body text-xs text-muted-foreground">
                      +{property.amenities.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            </TiltedCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
