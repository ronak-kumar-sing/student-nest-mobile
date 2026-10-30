import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ShieldCheck,
  FileCheck,
  Building2,
  GraduationCap,
  Bell,
  LogOut,
  Wrench,
  ChevronRight,
} from 'lucide-react-native';
import { useSessionStore } from '@/stores/session';
import { Avatar } from '@/components/ui/avatar';
import { toast } from '@/components/ui/toast';
import { colors } from '@/theme/tokens';

export default function OwnerProfileScreen() {
  const { user, logout, setRole } = useSessionStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)');
  };

  const handleSwitchToStudent = () => {
    setRole('student');
    router.replace('/(student)/(tabs)/explore');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <Text className="font-heading text-h2 text-foreground">Owner Account</Text>
        <TouchableOpacity
          onPress={() => router.push('/dev')}
          className="flex-row items-center rounded-full bg-muted/80 px-2.5 py-1.5"
        >
          <Wrench size={13} className="mr-1 text-muted-foreground" />
          <Text className="font-body-medium text-xs text-muted-foreground">Dev</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* User Card */}
        <View className="shadow-elevation-1 mb-6 flex-row items-center rounded-xl border border-border bg-card p-4">
          <Avatar
            name={user?.displayName ?? 'Amit Kumar'}
            src={user?.avatarUrl}
            size="lg"
            className="mr-4"
          />
          <View className="flex-1">
            <Text className="font-heading text-h3 text-foreground">
              {user?.displayName ?? 'Amit Kumar'}
            </Text>
            <Text className="mb-1.5 font-body text-xs text-muted-foreground">
              {user?.email ?? 'amit.kumar@example.com'}
            </Text>
            <View className="flex-row items-center">
              <View className="mr-2 rounded bg-primary/10 px-2 py-0.5">
                <Text className="font-body-semibold text-[11px] text-primary">Property Owner</Text>
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
          {/* KYC Status Action */}
          <TouchableOpacity
            onPress={() => toast.info('KYC Flow is part of Phase M2')}
            className="shadow-elevation-1 flex-row items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <View className="flex-1 flex-row items-center pr-3">
              <FileCheck size={20} color={colors.primary} className="mr-3" />
              <View>
                <Text className="font-body-semibold text-sm text-foreground">
                  Owner KYC Verification
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Aadhaar / PAN card verification status: Verified
                </Text>
              </View>
            </View>
            <ChevronRight size={18} className="text-muted-foreground" />
          </TouchableOpacity>

          {/* Switch Role Option */}
          <TouchableOpacity
            onPress={handleSwitchToStudent}
            className="flex-row items-center justify-between rounded-xl border border-border bg-muted/50 p-4"
          >
            <View className="flex-1 flex-row items-center pr-3">
              <GraduationCap size={20} className="mr-3 text-foreground" />
              <View>
                <Text className="font-body-semibold text-sm text-foreground">
                  Switch to Student View
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Explore rooms and search as a student tenant.
                </Text>
              </View>
            </View>
            <ChevronRight size={18} className="text-muted-foreground" />
          </TouchableOpacity>

          {/* Settings */}
          <View className="shadow-elevation-1 overflow-hidden rounded-xl border border-border bg-card">
            <TouchableOpacity className="flex-row items-center justify-between border-b border-border/40 p-3.5">
              <View className="flex-row items-center">
                <Building2 size={18} className="mr-3 text-muted-foreground" />
                <Text className="font-body text-sm text-foreground">Bank & Payout Settings</Text>
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
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mt-2 flex-row items-center justify-center rounded-xl border border-destructive/20 bg-card p-4"
          >
            <LogOut size={16} className="mr-2 text-destructive" />
            <Text className="font-body-semibold text-sm text-destructive">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
