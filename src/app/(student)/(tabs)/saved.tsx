import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart, MapPin, Trash2 } from 'lucide-react-native';
import { getDB } from '@/api/mock/db';
import { PriceTag } from '@/components/common/price-tag';
import { EmptyState } from '@/components/common/empty-state';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

export default function SavedScreen() {
  const { t } = useTranslation();
  const db = getDB();
  const savedProperties = db.properties.filter((p) => db.favorites.includes(p.id));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-3 bg-card border-b border-border">
        <Text className="text-h2 font-heading text-foreground">{t('tabs.saved')}</Text>
        <Text className="text-xs font-body text-muted-foreground">
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
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          <View className="gap-4">
            {savedProperties.map((property) => (
              <TouchableOpacity
                key={property.id}
                onPress={() => router.push(`/property/${property.id}`)}
                className="bg-card rounded-xl border border-border overflow-hidden flex-row shadow-elevation-1"
                activeOpacity={0.8}
              >
                <View className="w-32 h-32 bg-muted relative">
                  <Image
                    source={{ uri: property.images[0] }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>

                <View className="flex-1 p-3 justify-between">
                  <View>
                    <PriceTag paise={property.rentPaise} size="sm" />
                    <Text
                      className="text-sm font-body-semibold text-foreground mt-0.5"
                      numberOfLines={1}
                    >
                      {property.title}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <MapPin size={12} className="text-muted-foreground mr-1" />
                      <Text className="text-xs font-body text-muted-foreground">
                        {property.locality}, {property.city}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-border/40">
                    <Text className="text-xs font-body-medium text-primary">
                      {property.roomType.replace('_', ' ')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        db.favorites = db.favorites.filter((id) => id !== property.id);
                      }}
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

