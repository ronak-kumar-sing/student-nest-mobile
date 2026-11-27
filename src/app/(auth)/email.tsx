import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useSendEmailOtp } from '@/features/auth/queries';
import { isApiError, ErrorCodes, getErrorMessage } from '@/api/errors';
import { toast } from '@/components/ui/toast';

export default function EmailScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const sendEmailOtpMutation = useSendEmailOtp();

  const handleContinue = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');

    try {
      await sendEmailOtpMutation.mutateAsync(cleanEmail);
      router.push({
        pathname: '/(auth)/otp',
        params: { email: cleanEmail },
      });
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === ErrorCodes.VALIDATION_FAILED) {
          setError(t(getErrorMessage(err.code)));
        } else {
          toast.error(t(getErrorMessage(err.code)));
        }
      } else {
        toast.error(t('common.error'));
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-muted"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="mb-2 font-heading text-h1 text-foreground">What&apos;s your email?</Text>
          <Text className="font-body text-body text-muted-foreground">
            We&apos;ll send a 6-digit verification code to confirm your email.
          </Text>
        </View>

        <View className="mb-6">
          <Input
            label={t('auth.emailLabel')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoFocus
            error={error}
          />
        </View>

        <Button
          onPress={handleContinue}
          size="lg"
          disabled={!email.trim() || sendEmailOtpMutation.isPending}
          loading={sendEmailOtpMutation.isPending}
          className="mt-2 w-full"
        >
          <Text className="font-body-semibold text-body text-primary-foreground">
            {t('auth.continue')}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
