import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { colors } from '@/theme/tokens';

export default function PhoneVerifyScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');

  const handleVerify = () => {
    if (phone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    toast.success('Phone verified successfully (Mock mode)');
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 justify-between bg-background p-6">
      <View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-muted"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="mb-2 font-heading text-h1 text-foreground">{t('auth.phoneTitle')}</Text>
          <Text className="font-body text-body text-muted-foreground">
            {t('auth.phoneDescription')}
          </Text>
        </View>

        <View className="mb-4">
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
          />
        </View>

        <View className="flex-row items-center rounded-lg border border-border bg-card p-3">
          <ShieldCheck size={18} color={colors.success} className="mr-2" />
          <Text className="flex-1 font-body text-xs text-muted-foreground">
            Your number is never shared with owners until your booking or tour is confirmed.
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Button onPress={handleVerify} size="lg" className="w-full">
          <Text className="font-body-semibold text-body text-primary-foreground">
            Verify Phone Number
          </Text>
        </Button>

        <Button onPress={() => router.back()} variant="ghost" size="default" className="w-full">
          <Text className="font-body-medium text-muted-foreground">Skip for now</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
