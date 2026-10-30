import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';

export default function OtpScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? 'you@example.com';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = () => {
    // In mock mode, any code or 000000 works
    if (otp.length < 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    toast.success('Email verified successfully');
    router.push('/(auth)/role');
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-6">
      <TouchableOpacity
        onPress={() => router.back()}
        className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-muted"
      >
        <ArrowLeft size={20} className="text-foreground" />
      </TouchableOpacity>

      <View className="mb-8">
        <Text className="mb-2 font-heading text-h1 text-foreground">{t('auth.otpTitle')}</Text>
        <Text className="font-body text-body text-muted-foreground">
          {t('auth.otpDescription', { email })}
        </Text>
        <View className="mt-2 self-start rounded-md border border-info/20 bg-info/10 px-3 py-1.5">
          <Text className="font-body-medium text-xs text-info">💡 Mock Mode: Enter 000000</Text>
        </View>
      </View>

      <View className="mb-6">
        <Input
          label="Verification Code"
          placeholder="000000"
          value={otp}
          onChangeText={(text) => {
            setOtp(text.slice(0, 6));
            if (error) setError('');
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          error={error}
        />
      </View>

      <Button
        onPress={handleVerify}
        size="lg"
        disabled={otp.length !== 6}
        className="mb-6 mt-2 w-full"
      >
        <Text className="font-body-semibold text-body text-primary-foreground">
          Verify & Continue
        </Text>
      </Button>

      <View className="items-center">
        {countdown > 0 ? (
          <Text className="font-body text-sm text-muted-foreground">
            {t('auth.resendIn', { seconds: countdown })}
          </Text>
        ) : (
          <TouchableOpacity onPress={() => setCountdown(30)}>
            <Text className="font-body-semibold text-sm text-primary">{t('auth.resendCode')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
