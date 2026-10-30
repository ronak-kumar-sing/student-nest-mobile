import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Home, ShieldCheck, Users, Sparkles, Wrench } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/tokens';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 justify-between bg-background p-6">
      <View className="items-end">
        <TouchableOpacity
          onPress={() => router.push('/dev')}
          className="flex-row items-center rounded-full bg-muted/60 px-3 py-1.5"
        >
          <Wrench size={14} className="mr-1.5 text-muted-foreground" />
          <Text className="font-body-medium text-xs text-muted-foreground">Dev Menu</Text>
        </TouchableOpacity>
      </View>

      <View className="my-auto items-center">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Home size={40} color={colors.primary} />
        </View>

        <Text className="mb-3 text-center font-heading text-display text-foreground">
          Student Nest
        </Text>

        <Text className="mb-8 max-w-xs text-center text-body text-muted-foreground">
          Broker-free housing for students in India. Find verified rooms, PGs, and compatible
          roommates near your college.
        </Text>

        {/* Feature badges */}
        <View className="mb-6 flex-row gap-3">
          <View className="flex-row items-center rounded-lg border border-border bg-card px-3 py-2">
            <ShieldCheck size={16} color={colors.success} className="mr-1.5" />
            <Text className="font-body-medium text-xs text-foreground">Verified Owners</Text>
          </View>
          <View className="flex-row items-center rounded-lg border border-border bg-card px-3 py-2">
            <Users size={16} color={colors.info} className="mr-1.5" />
            <Text className="font-body-medium text-xs text-foreground">Roommates</Text>
          </View>
          <View className="flex-row items-center rounded-lg border border-border bg-card px-3 py-2">
            <Sparkles size={16} color={colors.warning} className="mr-1.5" />
            <Text className="font-body-medium text-xs text-foreground">0% Brokerage</Text>
          </View>
        </View>
      </View>

      <View className="w-full gap-3">
        <Button
          onPress={() => router.push('/(auth)/email')}
          size="lg"
          className="shadow-elevation-1 w-full"
        >
          <Text className="font-body-semibold text-body text-primary-foreground">
            {t('auth.getStarted')}
          </Text>
        </Button>

        <Button
          onPress={() => router.replace('/(student)/(tabs)/explore')}
          variant="ghost"
          size="default"
          className="w-full"
        >
          <Text className="font-body-medium text-muted-foreground">{t('auth.skipToBrowse')}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
