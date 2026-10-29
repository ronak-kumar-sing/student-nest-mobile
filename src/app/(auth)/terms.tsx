import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { Button } from '@/components/ui/button';

export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background p-6 justify-between">
      <View className="flex-1">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-muted mb-6"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>

        <Text className="text-h1 font-heading text-foreground mb-4">
          Terms & Privacy Policy
        </Text>

        <ScrollView className="flex-1 mb-6" showsVerticalScrollIndicator={false}>
          <Text className="text-sm font-body text-foreground mb-4 leading-6">
            Welcome to Student Nest. By continuing, you agree to our Terms of Service, Community Guidelines, and Privacy Policy.
          </Text>
          <Text className="text-sm font-body-semibold text-foreground mb-2">
            1. Zero Brokerage Guarantee
          </Text>
          <Text className="text-xs font-body text-muted-foreground mb-4 leading-5">
            Student Nest does not charge brokerage fees to students. You deal directly with verified owners.
          </Text>
          <Text className="text-sm font-body-semibold text-foreground mb-2">
            2. Privacy & Contact Protection
          </Text>
          <Text className="text-xs font-body text-muted-foreground mb-4 leading-5">
            Your personal phone number and exact address remain confidential until a booking application is approved or a tour is confirmed.
          </Text>
          <Text className="text-sm font-body-semibold text-foreground mb-2">
            3. Genuine Reviews Only
          </Text>
          <Text className="text-xs font-body text-muted-foreground mb-4 leading-5">
            Reviews may only be submitted by verified students who have booked or lived in the property.
          </Text>
        </ScrollView>
      </View>

      <Button onPress={() => router.back()} size="lg" className="w-full">
        <CheckCircle2 size={18} color="white" className="mr-2" />
        <Text className="text-primary-foreground font-body-semibold text-body">
          I Understand & Agree
        </Text>
      </Button>
    </SafeAreaView>
  );
}
