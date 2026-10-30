import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, GraduationCap, Building2, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/session';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

export default function RoleScreen() {
  const { t } = useTranslation();
  const setRole = useSessionStore((state) => state.setRole);
  const [selectedRole, setSelectedRole] = useState<'student' | 'owner'>('student');

  const handleContinue = () => {
    setRole(selectedRole);
    router.push('/(auth)/profile-setup');
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
          <Text className="mb-2 font-heading text-h1 text-foreground">{t('auth.roleTitle')}</Text>
          <Text className="font-body text-body text-muted-foreground">
            Select how you want to use Student Nest. You can also become an owner later.
          </Text>
        </View>

        <View className="gap-4">
          {/* Student option */}
          <TouchableOpacity
            onPress={() => setSelectedRole('student')}
            className={cn(
              'flex-row items-center justify-between rounded-xl border-2 p-5',
              selectedRole === 'student' ? 'border-primary bg-primary/5' : 'border-border bg-card',
            )}
          >
            <View className="flex-1 flex-row items-center pr-4">
              <View
                className={cn(
                  'mr-4 h-12 w-12 items-center justify-center rounded-xl',
                  selectedRole === 'student' ? 'bg-primary' : 'bg-muted',
                )}
              >
                <GraduationCap
                  size={24}
                  color={selectedRole === 'student' ? 'white' : colors.mutedForeground}
                />
              </View>
              <View className="flex-1">
                <Text className="text-body-semibold mb-1 font-heading text-foreground">
                  {t('auth.student')}
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Find verified rooms, book tours, and match with compatible roommates.
                </Text>
              </View>
            </View>
            <View
              className={cn(
                'h-6 w-6 items-center justify-center rounded-full border',
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
              'flex-row items-center justify-between rounded-xl border-2 p-5',
              selectedRole === 'owner' ? 'border-primary bg-primary/5' : 'border-border bg-card',
            )}
          >
            <View className="flex-1 flex-row items-center pr-4">
              <View
                className={cn(
                  'mr-4 h-12 w-12 items-center justify-center rounded-xl',
                  selectedRole === 'owner' ? 'bg-primary' : 'bg-muted',
                )}
              >
                <Building2
                  size={24}
                  color={selectedRole === 'owner' ? 'white' : colors.mutedForeground}
                />
              </View>
              <View className="flex-1">
                <Text className="text-body-semibold mb-1 font-heading text-foreground">
                  {t('auth.owner')}
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  List your property, manage bookings, and receive rent inquiries with 0% brokerage.
                </Text>
              </View>
            </View>
            <View
              className={cn(
                'h-6 w-6 items-center justify-center rounded-full border',
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
        <Text className="font-body-semibold text-body text-primary-foreground">
          {t('common.continue')}
        </Text>
      </Button>
    </SafeAreaView>
  );
}
