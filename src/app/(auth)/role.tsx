import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, GraduationCap, Building2, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/session';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

export default function RoleScreen() {
  const { t } = useTranslation();
  const setRole = useSessionStore((state) => state.setRole);
  const [selectedRole, setSelectedRole] = useState<'student' | 'owner'>('student');

  const handleContinue = () => {
    setRole(selectedRole);
    router.push('/(auth)/profile-setup');
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-6 justify-between">
      <View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-muted mb-6"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-h1 font-heading text-foreground mb-2">
            {t('auth.roleTitle')}
          </Text>
          <Text className="text-body font-body text-muted-foreground">
            Select how you want to use Student Nest. You can also become an owner later.
          </Text>
        </View>

        <View className="gap-4">
          {/* Student option */}
          <TouchableOpacity
            onPress={() => setSelectedRole('student')}
            className={cn(
              'p-5 rounded-xl border-2 flex-row items-center justify-between',
              selectedRole === 'student'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card',
            )}
          >
            <View className="flex-row items-center flex-1 pr-4">
              <View
                className={cn(
                  'h-12 w-12 rounded-xl items-center justify-center mr-4',
                  selectedRole === 'student' ? 'bg-primary' : 'bg-muted',
                )}
              >
                <GraduationCap
                  size={24}
                  color={selectedRole === 'student' ? 'white' : 'hsl(var(--muted-foreground))'}
                />
              </View>
              <View className="flex-1">
                <Text className="text-body-semibold font-heading text-foreground mb-1">
                  {t('auth.student')}
                </Text>
                <Text className="text-xs font-body text-muted-foreground">
                  Find verified rooms, book tours, and match with compatible roommates.
                </Text>
              </View>
            </View>
            <View
              className={cn(
                'h-6 w-6 rounded-full border items-center justify-center',
                selectedRole === 'student'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30',
              )}
            >
              {selectedRole === 'student' && <Check size={14} color="white" />}
            </View>
          </TouchableOpacity>

          {/* Owner option */}
          <TouchableOpacity
            onPress={() => setSelectedRole('owner')}
            className={cn(
              'p-5 rounded-xl border-2 flex-row items-center justify-between',
              selectedRole === 'owner'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card',
            )}
          >
            <View className="flex-row items-center flex-1 pr-4">
              <View
                className={cn(
                  'h-12 w-12 rounded-xl items-center justify-center mr-4',
                  selectedRole === 'owner' ? 'bg-primary' : 'bg-muted',
                )}
              >
                <Building2
                  size={24}
                  color={selectedRole === 'owner' ? 'white' : 'hsl(var(--muted-foreground))'}
                />
              </View>
              <View className="flex-1">
                <Text className="text-body-semibold font-heading text-foreground mb-1">
                  {t('auth.owner')}
                </Text>
                <Text className="text-xs font-body text-muted-foreground">
                  List your property, manage bookings, and receive rent inquiries with 0% brokerage.
                </Text>
              </View>
            </View>
            <View
              className={cn(
                'h-6 w-6 rounded-full border items-center justify-center',
                selectedRole === 'owner'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30',
              )}
            >
              {selectedRole === 'owner' && <Check size={14} color="white" />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Button onPress={handleContinue} size="lg" className="w-full">
        <Text className="text-primary-foreground font-body-semibold text-body">
          {t('common.continue')}
        </Text>
      </Button>
    </SafeAreaView>
  );
}
