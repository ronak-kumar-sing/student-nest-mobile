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
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
        <Text className="text-h2 font-heading text-foreground">{t('tabs.profile')}</Text>
        <TouchableOpacity
          onPress={() => router.push('/dev')}
          className="flex-row items-center bg-muted/80 px-2.5 py-1.5 rounded-full"
        >
          <Wrench size={13} className="text-muted-foreground mr-1" />
          <Text className="text-xs font-body-medium text-muted-foreground">Dev Menu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* User Card */}
        <View className="bg-card rounded-xl border border-border p-4 mb-6 flex-row items-center shadow-elevation-1">
          <Avatar
            name={user?.displayName ?? 'Student User'}
            src={user?.avatarUrl}
            size="lg"
            className="mr-4"
          />
          <View className="flex-1">
            <Text className="text-h3 font-heading text-foreground">
              {user?.displayName ?? 'Rahul Sharma'}
            </Text>
            <Text className="text-xs font-body text-muted-foreground mb-1.5">
              {user?.email ?? 'rahul.sharma@example.com'}
            </Text>
            <View className="flex-row items-center">
              <View className="bg-primary/10 px-2 py-0.5 rounded mr-2">
                <Text className="text-[11px] font-body-semibold text-primary capitalize">
                  {role ?? 'Student'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <ShieldCheck size={12} color="hsl(var(--success))" className="mr-0.5" />
                <Text className="text-[11px] font-body text-success">Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View className="gap-4">
          {/* Switch Role Option */}
          <TouchableOpacity
            onPress={handleSwitchToOwner}
            className="bg-primary/5 border border-primary/30 rounded-xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 pr-3">
              <Building2 size={20} color="hsl(var(--primary))" className="mr-3" />
              <View>
                <Text className="text-sm font-body-semibold text-primary">
                  Become a Room Owner
                </Text>
                <Text className="text-xs font-body text-muted-foreground">
                  Switch to the owner portal to list properties with 0% brokerage.
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="hsl(var(--primary))" />
          </TouchableOpacity>

          {/* Account Settings */}
          <View className="bg-card rounded-xl border border-border overflow-hidden shadow-elevation-1">
            <TouchableOpacity
              onPress={() => router.push('/(auth)/phone')}
              className="p-3.5 flex-row items-center justify-between border-b border-border/40"
            >
              <View className="flex-row items-center">
                <Phone size={18} className="text-muted-foreground mr-3" />
                <Text className="text-sm font-body text-foreground">Verify Phone Number</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="p-3.5 flex-row items-center justify-between border-b border-border/40">
              <View className="flex-row items-center">
                <Bell size={18} className="text-muted-foreground mr-3" />
                <Text className="text-sm font-body text-foreground">Notification Preferences</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="p-3.5 flex-row items-center justify-between border-b border-border/40">
              <View className="flex-row items-center">
                <Users size={18} className="text-muted-foreground mr-3" />
                <Text className="text-sm font-body text-foreground">Roommate Preferences</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="p-3.5 flex-row items-center justify-between border-b border-border/40">
              <View className="flex-row items-center">
                <Star size={18} className="text-muted-foreground mr-3" />
                <Text className="text-sm font-body text-foreground">My Reviews</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="p-3.5 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Flag size={18} className="text-muted-foreground mr-3" />
                <Text className="text-sm font-body text-foreground">My Reports</Text>
              </View>
              <ChevronRight size={16} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-card rounded-xl border border-destructive/20 p-4 flex-row items-center justify-center mt-2"
          >
            <LogOut size={16} className="text-destructive mr-2" />
            <Text className="text-sm font-body-semibold text-destructive">Log Out</Text>
          </TouchableOpacity>

          <Text className="text-center text-xs font-body text-muted-foreground mt-4">
            Student Nest v1.0.0 (M0 Build)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
