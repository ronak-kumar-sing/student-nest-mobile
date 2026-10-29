import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Home, ShieldCheck, Users, Sparkles, Wrench } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background justify-between p-6">
      <View className="items-end">
        <TouchableOpacity
          onPress={() => router.push('/dev')}
          className="flex-row items-center bg-muted/60 px-3 py-1.5 rounded-full"
        >
          <Wrench size={14} className="text-muted-foreground mr-1.5" />
          <Text className="text-xs font-body-medium text-muted-foreground">Dev Menu</Text>
        </TouchableOpacity>
      </View>

      <View className="items-center my-auto">
        <View className="h-20 w-20 rounded-2xl bg-primary/10 items-center justify-center mb-6">
          <Home size={40} color="hsl(var(--primary))" />
        </View>

        <Text className="text-display font-heading text-foreground text-center mb-3">
          Student Nest
        </Text>

        <Text className="text-body text-muted-foreground text-center max-w-xs mb-8">
          Broker-free housing for students in India. Find verified rooms, PGs, and compatible roommates near your college.
        </Text>

        {/* Feature badges */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-row items-center bg-card border border-border px-3 py-2 rounded-lg">
            <ShieldCheck size={16} color="hsl(var(--success))" className="mr-1.5" />
            <Text className="text-xs font-body-medium text-foreground">Verified Owners</Text>
          </View>
          <View className="flex-row items-center bg-card border border-border px-3 py-2 rounded-lg">
            <Users size={16} color="hsl(var(--info))" className="mr-1.5" />
            <Text className="text-xs font-body-medium text-foreground">Roommates</Text>
          </View>
          <View className="flex-row items-center bg-card border border-border px-3 py-2 rounded-lg">
            <Sparkles size={16} color="hsl(var(--warning))" className="mr-1.5" />
            <Text className="text-xs font-body-medium text-foreground">0% Brokerage</Text>
          </View>
        </View>
      </View>

      <View className="w-full gap-3">
        <Button
          onPress={() => router.push('/(auth)/email')}
          size="lg"
          className="w-full shadow-elevation-1"
        >
          <Text className="text-primary-foreground font-body-semibold text-body">
            {t('auth.getStarted')}
          </Text>
        </Button>

        <Button
          onPress={() => router.replace('/(student)/(tabs)/explore')}
          variant="ghost"
          size="default"
          className="w-full"
        >
          <Text className="text-muted-foreground font-body-medium">
            {t('auth.skipToBrowse')}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
