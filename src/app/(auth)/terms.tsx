import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { Button } from '@/components/ui/button';

export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1 justify-between bg-background p-6">
      <View className="flex-1">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-muted"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>

        <Text className="mb-4 font-heading text-h1 text-foreground">Terms & Privacy Policy</Text>

        <ScrollView className="mb-6 flex-1" showsVerticalScrollIndicator={false}>
          <Text className="mb-4 font-body text-sm leading-6 text-foreground">
            Welcome to Student Nest. By continuing, you agree to our Terms of Service, Community
            Guidelines, and Privacy Policy.
          </Text>
          <Text className="mb-2 font-body-semibold text-sm text-foreground">
            1. Zero Brokerage Guarantee
          </Text>
          <Text className="mb-4 font-body text-xs leading-5 text-muted-foreground">
            Student Nest does not charge brokerage fees to students. You deal directly with verified
            owners.
          </Text>
          <Text className="mb-2 font-body-semibold text-sm text-foreground">
            2. Privacy & Contact Protection
          </Text>
          <Text className="mb-4 font-body text-xs leading-5 text-muted-foreground">
            Your personal phone number and exact address remain confidential until a booking
            application is approved or a tour is confirmed.
          </Text>
          <Text className="mb-2 font-body-semibold text-sm text-foreground">
            3. Genuine Reviews Only
          </Text>
          <Text className="mb-4 font-body text-xs leading-5 text-muted-foreground">
            Reviews may only be submitted by verified students who have booked or lived in the
            property.
          </Text>
        </ScrollView>
      </View>

      <Button onPress={() => router.back()} size="lg" className="w-full">
        <CheckCircle2 size={18} color="white" className="mr-2" />
        <Text className="font-body-semibold text-body text-primary-foreground">
          I Understand & Agree
        </Text>
      </Button>
    </SafeAreaView>
  );
}
