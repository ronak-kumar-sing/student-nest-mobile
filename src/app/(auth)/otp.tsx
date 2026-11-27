import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { useSendEmailOtp, useVerifyEmailOtp } from '@/features/auth/queries';
import { authApi } from '@/features/auth/api';
import { mapUserMeDtoToSessionUser } from '@/features/auth/mappers';
import { useSessionStore } from '@/stores/session';
import { getTransportMode } from '@/api/mode';
import { getDB } from '@/api/mock/db';
import { isApiError, getErrorMessage } from '@/api/errors';

export default function OtpScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? 'you@example.com').trim().toLowerCase();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);

  const { setUser, setOnboarded, setPendingEmail, setStatus } = useSessionStore();
  const verifyOtpMutation = useVerifyEmailOtp();
  const sendEmailOtpMutation = useSendEmailOtp();

  const mode = getTransportMode('auth');
  const isMock = mode === 'mock';
  const isEmulator =
    !isMock && Boolean(__DEV__ && process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setError('');

    try {
      const res = await verifyOtpMutation.mutateAsync({ email, code: otp });

      if (res.isNewUser) {
        setPendingEmail(email);
        setStatus('needsSignup');
        toast.success('Email verified successfully');
        router.push('/(auth)/role');
      } else {
        toast.success('Signed in successfully');
        if (isMock) {
          const db = getDB();
          const dbUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
          if (dbUser) {
            setUser({
              id: dbUser.id,
              email: dbUser.email,
              displayName: dbUser.displayName,
              avatarUrl: dbUser.avatarUrl,
              phone: dbUser.phone,
              role: dbUser.role,
            });
            setOnboarded(true);
            setStatus('signedIn');
            if (dbUser.role === 'owner') {
              router.replace('/(owner)/(tabs)/dashboard');
            } else {
              router.replace('/(student)/(tabs)/explore');
            }
          } else {
            setPendingEmail(email);
            setStatus('needsSignup');
            router.push('/(auth)/role');
          }
        } else {
          // HTTP mode: fetch full profile and route by role
          try {
            const me = await authApi.getMe();
            const user = mapUserMeDtoToSessionUser(me);
            setUser(user);
            setOnboarded(true);
            setStatus('signedIn');
            if (user.role === 'owner') {
              router.replace('/(owner)/(tabs)/dashboard');
            } else {
              router.replace('/(student)/(tabs)/explore');
            }
          } catch {
            // If getMe fails or gate handles it, let session sync / AuthGate take over
          }
        }
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        setError(t(getErrorMessage(err.code)));
      } else {
        setError(t('common.error'));
      }
    }
  };

  const handleResend = async () => {
    try {
      const res = await sendEmailOtpMutation.mutateAsync(email);
      setCountdown(res.resendAfterSec || 30);
      toast.success('Verification code resent');
      setError('');
    } catch (err: unknown) {
      if (isApiError(err)) {
        toast.error(t(getErrorMessage(err.code)));
      } else {
        toast.error(t('common.error'));
      }
    }
  };

  const isVerifying = verifyOtpMutation.isPending;

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
          <Text className="mb-2 font-heading text-h1 text-foreground">{t('auth.otpTitle')}</Text>
          <Text className="font-body text-body text-muted-foreground">
            {t('auth.otpDescription', { email })}
          </Text>

          {isMock && (
            <View className="mt-3 self-start rounded-md border border-info/20 bg-info/10 px-3 py-1.5">
              <Text className="font-body-medium text-xs text-info">Mock mode: enter 000000</Text>
            </View>
          )}

          {isEmulator && (
            <View className="mt-3 self-start rounded-md border border-info/20 bg-info/10 px-3 py-1.5">
              <Text className="font-body-medium text-xs text-info">
                Emulator: code 000000 works for @test.studentnest.app emails
              </Text>
            </View>
          )}
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
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            error={error}
          />
        </View>

        <Button
          onPress={handleVerify}
          size="lg"
          disabled={otp.length !== 6 || isVerifying}
          loading={isVerifying}
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
            <TouchableOpacity onPress={handleResend} disabled={sendEmailOtpMutation.isPending}>
              <Text className="font-body-semibold text-sm text-primary">
                {sendEmailOtpMutation.isPending ? 'Sending...' : t('auth.resendCode')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
