import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  FileCheck,
  Building2,
  GraduationCap,
  Bell,
  LogOut,
  Wrench,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { useSessionStore } from '@/stores/session';
import { ReflectiveCard } from '@/components/common/reflective-card';
import { SpotlightCard } from '@/components/common/spotlight-card';
import { PeekRating } from '@/components/common/peek-rating';
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
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
      >
        {/* Reflective Metallic Identity Card */}
        <View className="mb-5">
          <ReflectiveCard
            name={user?.displayName ?? 'Amit Kumar'}
            role="Verified Property Owner"
            badge="Verified Host"
            status="Active"
            statusColor="#22c55e"
            idLabel="Owner License ID"
            idValue={`NEST-${(user?.id || 'OWN101').toUpperCase()}-2026`}
            theme="dark"
            radius={20}
          />
        </View>

        {/* Owner Spotlight Reputation & Trust Showcase */}
        <View className="mb-6">
          <SpotlightCard
            theme="dark"
            spotlightColor="#10B981"
            intensity={0.28}
            spotlightSize={260}
            borderGlow={0.65}
            ambient={true}
            flare={true}
            radius={22}
          >
            <View className="p-4">
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                    <ShieldCheck size={18} color="#10B981" />
                  </View>
                  <View>
                    <Text className="font-heading text-sm text-white">Trust & Rating Score</Text>
                    <Text className="text-[11px] text-zinc-400">Owner Hospitality Index</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 border border-emerald-500/30">
                  <Sparkles size={11} color="#10B981" />
                  <Text className="text-[11px] font-bold text-emerald-400">4.9 / 5.0</Text>
                </View>
              </View>

              {/* Interactive PeekRating */}
              <View className="items-center py-2 bg-zinc-900/60 rounded-xl mb-3 border border-white/5">
                <PeekRating
                  defaultValue={5}
                  count={5}
                  size={26}
                  activeColor="#10B981"
                  idleColor="#3F3F46"
                  tipColor="#064E3B"
                  tipTextColor="#A7F3D0"
                  labels={['Needs Work', 'Fair', 'Good', 'Very Good', 'Superb Host']}
                  showTip={true}
                  readOnly={false}
                />
              </View>

              {/* Verified Owner Stats Row */}
              <View className="flex-row justify-between border-t border-white/10 pt-3">
                <View className="items-center flex-1">
                  <Text className="text-[11px] text-zinc-400">Properties</Text>
                  <Text className="font-heading text-sm text-white mt-0.5">3 Active</Text>
                </View>
                <View className="w-[1px] bg-white/10" />
                <View className="items-center flex-1">
                  <Text className="text-[11px] text-zinc-400">Response Rate</Text>
                  <Text className="font-heading text-sm text-white mt-0.5">98%</Text>
                </View>
                <View className="w-[1px] bg-white/10" />
                <View className="items-center flex-1">
                  <Text className="text-[11px] text-zinc-400">Avg Time</Text>
                  <Text className="font-heading text-sm text-white mt-0.5">&lt; 15 mins</Text>
                </View>
              </View>
            </View>
          </SpotlightCard>
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
