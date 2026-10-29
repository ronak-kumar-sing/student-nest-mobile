import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, SlidersHorizontal, MapPin, Heart, Wrench, Users } from 'lucide-react-native';
import { getDB, MockProperty } from '@/api/mock/db';
import { PriceTag } from '@/components/common/price-tag';
import { Chip } from '@/components/ui/chip';
import { Image } from 'expo-image';

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
      <View className="px-4 pt-2 pb-3 bg-card border-b border-border">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-h2 font-heading text-foreground">Find Your Nest</Text>
            <Text className="text-xs font-body text-muted-foreground">
              Direct from verified owners • 0% Brokerage
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/dev')}
            className="flex-row items-center bg-muted/80 px-2.5 py-1.5 rounded-full"
            accessibilityLabel="Open Dev Menu"
          >
            <Wrench size={13} className="text-muted-foreground mr-1" />
            <Text className="text-xs font-body-medium text-muted-foreground">Dev</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-muted/70 rounded-xl px-3 py-2 border border-border">
          <Search size={18} className="text-muted-foreground mr-2" />
          <TextInput
            placeholder="Search locality, college, city..."
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 font-body text-sm text-foreground p-0"
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
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-body-semibold text-foreground">
            {filteredProperties.length} Verified Rooms Available
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(student)/(tabs)/activity')}
            className="flex-row items-center"
          >
            <Users size={14} color="hsl(var(--primary))" className="mr-1" />
            <Text className="text-xs font-body-semibold text-primary">Find Roommates</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-4">
          {filteredProperties.slice(0, 15).map((property: MockProperty) => (
            <TouchableOpacity
              key={property.id}
              onPress={() => router.push(`/property/${property.id}`)}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-elevation-1"
              activeOpacity={0.8}
            >
              {/* Cover Image */}
              <View className="relative h-44 w-full bg-muted">
                <Image
                  source={{ uri: property.images[0] }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
                <TouchableOpacity
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-md items-center justify-center"
                  accessibilityLabel="Save property"
                >
                  <Heart size={16} color="hsl(var(--foreground))" />
                </TouchableOpacity>

                <View className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-md">
                  <Text className="text-xs font-body-semibold text-foreground capitalize">
                    {property.roomType.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {/* Info Block */}
              <View className="p-3.5">
                <View className="flex-row items-center justify-between mb-1">
                  <PriceTag paise={property.rentPaise} size="default" />
                  <View className="flex-row items-center bg-muted px-2 py-0.5 rounded">
                    <Text className="text-xs font-body-semibold text-foreground">
                      ★ {property.rating}
                    </Text>
                    <Text className="text-xs font-body text-muted-foreground ml-1">
                      ({property.reviewCount})
                    </Text>
                  </View>
                </View>

                <Text
                  className="text-body font-body-semibold text-foreground mb-1.5"
                  numberOfLines={1}
                >
                  {property.title}
                </Text>

                <View className="flex-row items-center text-muted-foreground mb-2">
                  <MapPin size={13} className="text-muted-foreground mr-1" />
                  <Text className="text-xs font-body text-muted-foreground">
                    {property.locality}, {property.city}
                  </Text>
                </View>

                {/* Amenities pills */}
                <View className="flex-row flex-wrap gap-1.5 pt-2 border-t border-border/60">
                  {property.amenities.slice(0, 3).map((amenity) => (
                    <View key={amenity} className="bg-muted px-2 py-0.5 rounded">
                      <Text className="text-xs font-body text-muted-foreground">
                        {amenity}
                      </Text>
                    </View>
                  ))}
                  {property.amenities.length > 3 && (
                    <Text className="text-xs font-body text-muted-foreground self-center">
                      +{property.amenities.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
