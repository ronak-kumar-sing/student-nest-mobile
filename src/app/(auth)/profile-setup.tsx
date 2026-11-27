import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSessionStore, type User } from '@/stores/session';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { useSignup, useUpdateProfile } from '@/features/auth/queries';
import { TERMS_VERSION } from '@/features/auth/constants';
import { isApiError, ErrorCodes, getErrorMessage } from '@/api/errors';
import { cn } from '@/lib/cn';

const GENDER_OPTIONS: {
  label: string;
  value: 'male' | 'female' | 'non_binary' | 'undisclosed';
}[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non_binary' },
  { label: 'Prefer not to say', value: 'undisclosed' },
];

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const { pendingRole, pendingEmail, setUser, setOnboarded, setStatus } = useSessionStore();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'non_binary' | 'undisclosed'>('male');
  const [college, setCollege] = useState('');
  const [city, setCity] = useState('Indore');

  const signupMutation = useSignup();
  const updateProfileMutation = useUpdateProfile();

  const activeRole = pendingRole ?? 'student';

  const handleFinish = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setNameError('Full name must be between 2 and 50 characters');
      return;
    }
    setNameError('');

    try {
      // 1. Call POST /v1/auth/signup
      const signupRes = await signupMutation.mutateAsync({
        role: activeRole,
        displayName: trimmedName,
        acceptedTermsVersion: TERMS_VERSION,
        marketingOptIn: false,
      });

      // 2. Call PATCH /v1/users/me with optional fields
      try {
        await updateProfileMutation.mutateAsync({
          gender,
          college: activeRole === 'student' ? college.trim() || undefined : undefined,
          city: city.trim().toLowerCase() || undefined,
        });
      } catch {
        // If profile details patch fails, show a toast but still finish onboarding
        toast.error('Could not save extra profile details');
      }

      // 3. Set session
      const sessionUser: User = {
        id: signupRes.user.id,
        email: signupRes.user.email ?? pendingEmail ?? '',
        displayName: trimmedName,
        avatarUrl: null,
        phone: signupRes.user.phone ?? null,
        role: activeRole,
      };

      setUser(sessionUser);
      setOnboarded(true);
      setStatus('signedIn');

      toast.success('Account created successfully!');

      if (activeRole === 'owner') {
        router.replace('/(owner)/(tabs)/dashboard');
      } else {
        router.replace('/(student)/(tabs)/explore');
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === ErrorCodes.ALREADY_REGISTERED) {
          toast.error(t(getErrorMessage(err.code)));
        } else if (err.code === ErrorCodes.VALIDATION_FAILED) {
          setNameError(t(getErrorMessage(err.code)));
        } else {
          toast.error(t(getErrorMessage(err.code)));
        }
      } else {
        toast.error(t('common.error'));
      }
    }
  };

  const isSubmitting = signupMutation.isPending || updateProfileMutation.isPending;

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="mb-6">
            <Text className="mb-2 font-heading text-h1 text-foreground">
              {t('auth.profileTitle')}
            </Text>
            <Text className="font-body text-body text-muted-foreground">
              Tell us a bit about yourself to personalize your experience.
            </Text>
          </View>

          <View className="mb-6 gap-4">
            <Input
              label={t('auth.nameLabel')}
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError('');
              }}
              autoFocus
              error={nameError}
            />

            <View>
              <Text className="mb-1.5 font-body-medium text-sm text-foreground">
                {t('auth.genderLabel')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    onPress={() => setGender(g.value)}
                    className={cn(
                      'min-w-[45%] flex-1 items-center rounded-lg border px-2 py-2.5',
                      gender === g.value ? 'border-primary bg-primary/10' : 'border-border bg-card',
                    )}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: gender === g.value }}
                  >
                    <Text
                      className={cn(
                        'font-body-medium text-xs',
                        gender === g.value ? 'font-semibold text-primary' : 'text-foreground',
                      )}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {activeRole === 'student' && (
              <Input
                label={t('auth.collegeLabel')}
                placeholder="e.g. IET DAVV / SGSITS"
                value={college}
                onChangeText={setCollege}
                maxLength={100}
              />
            )}

            <Input
              label={t('auth.cityLabel')}
              placeholder="e.g. Indore / Bengaluru / Pune"
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* Terms Line */}
          <View className="mb-4 items-center">
            <TouchableOpacity onPress={() => router.push('/(auth)/terms')} activeOpacity={0.7}>
              <Text className="text-center font-body text-xs text-muted-foreground">
                By creating an account, you agree to our{' '}
                <Text className="font-body-semibold text-primary">Terms of Service</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            onPress={handleFinish}
            size="lg"
            disabled={!name.trim() || isSubmitting}
            loading={isSubmitting}
            className="mt-2 w-full"
          >
            <Text className="font-body-semibold text-body text-primary-foreground">
              Complete Setup
            </Text>
          </Button>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
