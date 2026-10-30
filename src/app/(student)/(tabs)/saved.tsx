import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart, MapPin, Trash2 } from 'lucide-react-native';
import { getDB, removeFavorite } from '@/api/mock/db';
import { PriceTag } from '@/components/common/price-tag';
import { EmptyState } from '@/components/common/empty-state';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';

export default function SavedScreen() {
  const { t } = useTranslation();
  const db = getDB();
  const [favoriteIds, setFavoriteIds] = useState<string[]>(db.favorites);

  const savedProperties = db.properties.filter((p) => favoriteIds.includes(p.id));

  const handleRemove = (propertyId: string) => {
    removeFavorite(propertyId);
    setFavoriteIds((prev) => prev.filter((id) => id !== propertyId));
    toast.info('Removed from saved properties');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-border bg-card px-4 py-3">
        <Text className="font-heading text-h2 text-foreground">{t('tabs.saved')}</Text>
        <Text className="font-body text-xs text-muted-foreground">
          {savedProperties.length} properties saved
        </Text>
      </View>

      {savedProperties.length === 0 ? (
        <EmptyState
          title="No saved properties yet"
          description="Tap the heart icon on any listing to save it for quick access later."
          actionLabel="Explore Rooms"
          onAction={() => router.push('/(student)/(tabs)/explore')}
          icon={Heart}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        >
          <View className="gap-4">
            {savedProperties.map((property) => (
              <TouchableOpacity
                key={property.id}
                onPress={() => router.push(`/property/${property.id}`)}
                className="shadow-elevation-1 flex-row overflow-hidden rounded-xl border border-border bg-card"
                activeOpacity={0.8}
              >
                <View className="relative h-32 w-32 bg-muted">
                  <Image
                    source={{ uri: property.images[0] }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>

                <View className="flex-1 justify-between p-3">
                  <View>
                    <PriceTag paise={property.rentPaise} size="sm" />
                    <Text
                      className="mt-0.5 font-body-semibold text-sm text-foreground"
                      numberOfLines={1}
                    >
                      {property.title}
                    </Text>
                    <View className="mt-1 flex-row items-center">
                      <MapPin size={12} className="mr-1 text-muted-foreground" />
                      <Text className="font-body text-xs text-muted-foreground">
                        {property.locality}, {property.city}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between border-t border-border/40 pt-2">
                    <Text className="font-body-medium text-xs text-primary">
                      {property.roomType.replace('_', ' ')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemove(property.id)}
                      className="p-1"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </TouchableOpacity>
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
