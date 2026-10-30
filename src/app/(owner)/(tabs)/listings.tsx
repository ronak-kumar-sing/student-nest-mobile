import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Building2, MapPin } from 'lucide-react-native';
import { getDB, MockProperty } from '@/api/mock/db';
import { StatusPill } from '@/components/common/status-pill';
import { PriceTag } from '@/components/common/price-tag';
import { EmptyState } from '@/components/common/empty-state';
import { TiltedCard } from '@/components/common/tilted-card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function OwnerListingsScreen() {
  const { t } = useTranslation();
  const db = getDB();
  const listings = db.properties.filter((p) => p.ownerId === 'owner-1');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <View>
          <Text className="font-heading text-h2 text-foreground">{t('tabs.listings')}</Text>
          <Text className="font-body text-xs text-muted-foreground">
            {listings.length} managed properties
          </Text>
        </View>
        <Button
          onPress={() => router.push('/property/new')}
          size="sm"
          className="flex-row items-center"
        >
          <Plus size={16} color="white" className="mr-1" />
          <Text className="font-body-semibold text-xs text-primary-foreground">Add Listing</Text>
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
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        >
          <View className="gap-4">
            {listings.map((property: MockProperty, idx: number) => (
              <TiltedCard
                key={property.id}
                imageSrc={property.images[0]}
                captionText={`Status: ${property.status}`}
                imageHeight={160}
                radius={16}
                rotateAmplitude={12}
                index={idx}
                onClick={() => router.push(`/property/${property.id}`)}
              >
                <View className="p-3.5 bg-card">
                  <View className="mb-1 flex-row items-center justify-between">
                    <PriceTag paise={property.rentPaise} size="sm" />
                    <View className="flex-row items-center gap-1.5">
                      <StatusPill status={property.status} />
                      <Text className="font-body-medium text-xs capitalize text-muted-foreground">
                        {property.roomType.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <Text
                    className="mb-1 font-body-semibold text-body text-foreground"
                    numberOfLines={1}
                  >
                    {property.title}
                  </Text>

                  <View className="flex-row items-center text-muted-foreground">
                    <MapPin size={12} className="mr-1 text-muted-foreground" />
                    <Text className="font-body text-xs text-muted-foreground">
                      {property.locality}, {property.city}
                    </Text>
                  </View>
                </View>
              </TiltedCard>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
