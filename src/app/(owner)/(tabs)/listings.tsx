import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Building2, MapPin } from 'lucide-react-native';
import { getDB, MockProperty } from '@/api/mock/db';
import { StatusPill } from '@/components/common/status-pill';
import { PriceTag } from '@/components/common/price-tag';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

export default function OwnerListingsScreen() {
  const { t } = useTranslation();
  const db = getDB();
  const listings = db.properties.filter((p) => p.ownerId === 'owner-1');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
        <View>
          <Text className="text-h2 font-heading text-foreground">{t('tabs.listings')}</Text>
          <Text className="text-xs font-body text-muted-foreground">
            {listings.length} managed properties
          </Text>
        </View>
        <Button
          onPress={() => router.push('/property/new')}
          size="sm"
          className="flex-row items-center"
        >
          <Plus size={16} color="white" className="mr-1" />
          <Text className="text-xs font-body-semibold text-primary-foreground">Add Listing</Text>
        </Button>
      </View>

      {listings.length === 0 ? (
        <EmptyState
          title="No properties listed yet"
          description="List your student rooms, PGs, or flats to connect directly with college students."
          actionLabel="Create First Listing"
          onAction={() => router.push('/property/new')}
          icon={Building2}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          <View className="gap-4">
            {listings.map((property: MockProperty) => (
              <TouchableOpacity
                key={property.id}
                onPress={() => router.push(`/property/${property.id}`)}
                className="bg-card rounded-xl border border-border overflow-hidden shadow-elevation-1"
                activeOpacity={0.8}
              >
                <View className="h-36 w-full bg-muted relative">
                  <Image
                    source={{ uri: property.images[0] }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                  <View className="absolute top-3 left-3">
                    <StatusPill status={property.status} />
                  </View>
                </View>

                <View className="p-3.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <PriceTag paise={property.rentPaise} size="sm" />
                    <Text className="text-xs font-body-medium text-muted-foreground capitalize">
                      {property.roomType.replace('_', ' ')}
                    </Text>
                  </View>

                  <Text
                    className="text-body font-body-semibold text-foreground mb-1"
                    numberOfLines={1}
                  >
                    {property.title}
                  </Text>

                  <View className="flex-row items-center text-muted-foreground">
                    <MapPin size={12} className="text-muted-foreground mr-1" />
                    <Text className="text-xs font-body text-muted-foreground">
                      {property.locality}, {property.city}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
