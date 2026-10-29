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
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
        <Text className="text-h2 font-heading text-foreground">Owner Account</Text>
        <TouchableOpacity
          onPress={() => router.push('/dev')}
          className="flex-row items-center bg-muted/80 px-2.5 py-1.5 rounded-full"
        >
          <Wrench size={13} className="text-muted-foreground mr-1" />
          <Text className="text-xs font-body-medium text-muted-foreground">Dev</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* User Card */}
        <View className="bg-card rounded-xl border border-border p-4 mb-6 flex-row items-center shadow-elevation-1">
          <Avatar
            name={user?.displayName ?? 'Amit Kumar'}
            src={user?.avatarUrl}
            size="lg"
            className="mr-4"
          />
          <View className="flex-1">
            <Text className="text-h3 font-heading text-foreground">
              {user?.displayName ?? 'Amit Kumar'}
            </Text>
            <Text className="text-xs font-body text-muted-foreground mb-1.5">
              {user?.email ?? 'amit.kumar@example.com'}
            </Text>
            <View className="flex-row items-center">
              <View className="bg-primary/10 px-2 py-0.5 rounded mr-2">
                <Text className="text-[11px] font-body-semibold text-primary">
                  Property Owner
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
          {/* KYC Status Action */}
          <TouchableOpacity
            onPress={() => toast.info('KYC Flow is part of Phase M2')}
            className="bg-card rounded-xl border border-border p-4 flex-row items-center justify-between shadow-elevation-1"
          >
            <View className="flex-row items-center flex-1 pr-3">
              <FileCheck size={20} color="hsl(var(--primary))" className="mr-3" />
              <View>
                <Text className="text-sm font-body-semibold text-foreground">
                  Owner KYC Verification
                </Text>
                <Text className="text-xs font-body text-muted-foreground">
                  Aadhaar / PAN card verification status: Verified
                </Text>
              </View>
            </View>
            <ChevronRight size={18} className="text-muted-foreground" />
          </TouchableOpacity>

          {/* Switch Role Option */}
          <TouchableOpacity
            onPress={handleSwitchToStudent}
            className="bg-muted/50 border border-border rounded-xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 pr-3">
              <GraduationCap size={20} className="text-foreground mr-3" />
              <View>
                <Text className="text-sm font-body-semibold text-foreground">
                  Switch to Student View
                </Text>
                <Text className="text-xs font-body text-muted-foreground">
                  Explore rooms and search as a student tenant.
                </Text>
              </View>
            </View>
            <ChevronRight size={18} className="text-muted-foreground" />
          </TouchableOpacity>

          {/* Settings */}
          <View className="bg-card rounded-xl border border-border overflow-hidden shadow-elevation-1">
            <TouchableOpacity className="p-3.5 flex-row items-center justify-between border-b border-border/40">
              <View className="flex-row items-center">
                <Building2 size={18} className="text-muted-foreground mr-3" />
                <Text className="text-sm font-body text-foreground">Bank & Payout Settings</Text>
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
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-card rounded-xl border border-destructive/20 p-4 flex-row items-center justify-center mt-2"
          >
            <LogOut size={16} className="text-destructive mr-2" />
            <Text className="text-sm font-body-semibold text-destructive">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
