import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/session';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const { role, setUser, setOnboarded } = useSessionStore();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [college, setCollege] = useState('');
  const [city, setCity] = useState('Indore');

  const handleFinish = () => {
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    const newUser = {
      id: role === 'owner' ? 'owner-1' : 'student-1',
      email: 'user@example.com',
      displayName: name,
      avatarUrl: null,
      phone: null,
      role: role ?? 'student',
    };

    setUser(newUser);
    setOnboarded(true);
    toast.success('Profile created successfully!');

    if (role === 'owner') {
      router.replace('/(owner)/(tabs)/dashboard');
    } else {
      router.replace('/(student)/(tabs)/explore');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-6">
      <TouchableOpacity
        onPress={() => router.back()}
        className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-muted"
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
            onChangeText={setName}
            autoFocus
          />

          <View>
            <Text className="mb-1.5 font-body-medium text-sm text-foreground">
              {t('auth.genderLabel')}
            </Text>
            <View className="flex-row gap-2">
              {(['male', 'female', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  className={`flex-1 items-center rounded-lg border py-2.5 capitalize ${
                    gender === g ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}
                >
                  <Text
                    className={`font-body-medium text-sm ${
                      gender === g ? 'font-semibold text-primary' : 'text-foreground'
                    }`}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {role === 'student' && (
            <Input
              label={t('auth.collegeLabel')}
              placeholder="e.g. IET DAVV / SGSITS"
              value={college}
              onChangeText={setCollege}
            />
          )}

          <Input
            label={t('auth.cityLabel')}
            placeholder="e.g. Indore / Bengaluru / Pune"
            value={city}
            onChangeText={setCity}
          />
        </View>

        <Button onPress={handleFinish} size="lg" className="mt-4 w-full">
          <Text className="font-body-semibold text-body text-primary-foreground">
            Complete Setup
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
