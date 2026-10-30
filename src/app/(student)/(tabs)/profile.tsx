import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ShieldCheck,
  Phone,
  Bell,
  Users,
  Star,
  Flag,
  Building2,
  LogOut,
  Wrench,
  ChevronRight,
} from 'lucide-react-native';
import { useSessionStore } from '@/stores/session';
import { Avatar } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/tokens';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, role, logout, setRole } = useSessionStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)');
  };

  const handleSwitchToOwner = () => {
    setRole('owner');
    router.replace('/(owner)/(tabs)/dashboard');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <Text className="font-heading text-h2 text-foreground">{t('tabs.profile')}</Text>
        <TouchableOpacity
          onPress={() => router.push('/dev')}
          className="flex-row items-center rounded-full bg-muted/80 px-2.5 py-1.5"
        >
          <Wrench size={13} className="mr-1 text-muted-foreground" />
          <Text className="font-body-medium text-xs text-muted-foreground">Dev Menu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* User Card */}
        <View className="shadow-elevation-1 mb-6 flex-row items-center rounded-xl border border-border bg-card p-4">
          <Avatar
            name={user?.displayName ?? 'Student User'}
            src={user?.avatarUrl}
            size="lg"
            className="mr-4"
          />
          <View className="flex-1">
            <Text className="font-heading text-h3 text-foreground">
              {user?.displayName ?? 'Rahul Sharma'}
            </Text>
            <Text className="mb-1.5 font-body text-xs text-muted-foreground">
              {user?.email ?? 'rahul.sharma@example.com'}
            </Text>
            <View className="flex-row items-center">
              <View className="mr-2 rounded bg-primary/10 px-2 py-0.5">
                <Text className="font-body-semibold text-[11px] capitalize text-primary">
                  {role ?? 'Student'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <ShieldCheck size={12} color={colors.success} className="mr-0.5" />
                <Text className="font-body text-[11px] text-success">Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View className="gap-4">
          {/* Switch Role Option */}
          <TouchableOpacity
            onPress={handleSwitchToOwner}
            className="flex-row items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <View className="flex-1 flex-row items-center pr-3">
              <Building2 size={20} color={colors.primary} className="mr-3" />
              <View>
                <Text className="font-body-semibold text-sm text-primary">Become a Room Owner</Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Switch to the owner portal to list properties with 0% brokerage.
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.primary} />
          </TouchableOpacity>

          {/* Account Settings */}
          <View className="shadow-elevation-1 overflow-hidden rounded-xl border border-border bg-card">
            <TouchableOpacity
              onPress={() => router.push('/(auth)/phone')}
              className="flex-row items-center justify-between border-b border-border/40 p-3.5"
            >
              <View className="flex-row items-center">
                <Phone size={18} className="mr-3 text-muted-foreground" />
                <Text className="font-body text-sm text-foreground">Verify Phone Number</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between border-b border-border/40 p-3.5">
              <View className="flex-row items-center">
                <Bell size={18} className="mr-3 text-muted-foreground" />
                <Text className="font-body text-sm text-foreground">Notification Preferences</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between border-b border-border/40 p-3.5">
              <View className="flex-row items-center">
                <Users size={18} className="mr-3 text-muted-foreground" />
                <Text className="font-body text-sm text-foreground">Roommate Preferences</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between border-b border-border/40 p-3.5">
              <View className="flex-row items-center">
                <Star size={18} className="mr-3 text-muted-foreground" />
                <Text className="font-body text-sm text-foreground">My Reviews</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-3.5">
              <View className="flex-row items-center">
                <Flag size={18} className="mr-3 text-muted-foreground" />
                <Text className="font-body text-sm text-foreground">My Reports</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mt-2 flex-row items-center justify-center rounded-xl border border-destructive/20 bg-card p-4"
          >
            <LogOut size={16} className="mr-2 text-destructive" />
            <Text className="font-body-semibold text-sm text-destructive">Log Out</Text>
          </TouchableOpacity>

          <Text className="mt-4 text-center font-body text-xs text-muted-foreground">
            Student Nest v1.0.0 (M0 Build)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
