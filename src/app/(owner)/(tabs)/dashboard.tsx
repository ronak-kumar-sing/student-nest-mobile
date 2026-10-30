import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Eye,
  Heart,
  MessageSquare,
  CalendarCheck,
  AlertTriangle,
  ChevronRight,
  PlusCircle,
  Wrench,
  TrendingUp,
} from 'lucide-react-native';
import { getDB } from '@/api/mock/db';
import { Button } from '@/components/ui/button';
import { colors } from '@/theme/tokens';

export default function OwnerDashboardScreen() {
  const db = getDB();
  const pendingRequests = db.bookings.filter(
    (b) => b.ownerId === 'owner-1' && b.status === 'pending',
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <View>
          <Text className="font-heading text-h2 text-foreground">Owner Portal</Text>
          <Text className="font-body text-xs text-muted-foreground">
            Manage listings & incoming tenant requests
          </Text>
        </View>
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
        {/* KYC Verification Banner */}
        <View className="mb-5 flex-row items-start rounded-xl border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle size={20} color={colors.warning} className="mr-3 mt-0.5" />
          <View className="flex-1">
            <Text className="mb-1 font-body-semibold text-sm text-warning">
              KYC Verification Required
            </Text>
            <Text className="mb-3 font-body text-xs leading-5 text-muted-foreground">
              To publish listings and receive student applications, please complete your government
              ID verification.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(owner)/(tabs)/profile')}
              className="self-start rounded-lg bg-warning px-3 py-1.5"
            >
              <Text className="font-body-semibold text-xs text-warning-foreground">
                Start KYC Verification
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 30-Day KPI Stats */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-body-semibold text-sm text-foreground">
              Last 30 Days Performance
            </Text>
            <View className="flex-row items-center">
              <TrendingUp size={14} color={colors.success} className="mr-1" />
              <Text className="font-body-semibold text-xs text-success">+18%</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <View className="shadow-elevation-1 min-w-[45%] flex-1 rounded-xl border border-border bg-card p-3.5">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-body text-xs text-muted-foreground">Listing Views</Text>
                <Eye size={16} className="text-primary" />
              </View>
              <Text className="font-heading text-h2 text-foreground">1,248</Text>
            </View>

            <View className="shadow-elevation-1 min-w-[45%] flex-1 rounded-xl border border-border bg-card p-3.5">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-body text-xs text-muted-foreground">Saves</Text>
                <Heart size={16} color={colors.destructive} />
              </View>
              <Text className="font-heading text-h2 text-foreground">142</Text>
            </View>

            <View className="shadow-elevation-1 min-w-[45%] flex-1 rounded-xl border border-border bg-card p-3.5">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-body text-xs text-muted-foreground">Inquiries</Text>
                <MessageSquare size={16} className="text-info" />
              </View>
              <Text className="font-heading text-h2 text-foreground">28</Text>
            </View>

            <View className="shadow-elevation-1 min-w-[45%] flex-1 rounded-xl border border-border bg-card p-3.5">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-body text-xs text-muted-foreground">Bookings</Text>
                <CalendarCheck size={16} color={colors.success} />
              </View>
              <Text className="font-heading text-h2 text-foreground">6</Text>
            </View>
          </View>
        </View>

        {/* Pending Requests Shortcut */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-body-semibold text-sm text-foreground">
              Pending Tenant Requests
            </Text>
            <TouchableOpacity onPress={() => router.push('/(owner)/(tabs)/requests')}>
              <Text className="font-body-semibold text-xs text-primary">View All</Text>
            </TouchableOpacity>
          </View>

          {pendingRequests.length === 0 ? (
            <View className="items-center rounded-xl border border-border bg-card p-4">
              <Text className="font-body text-xs text-muted-foreground">
                No new pending applications right now.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(owner)/(tabs)/requests')}
              className="shadow-elevation-1 flex-row items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <View>
                <Text className="font-body-semibold text-sm text-foreground">
                  {pendingRequests.length} Booking Applications Awaiting Approval
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Review student profiles & approve with agreed rent
                </Text>
              </View>
              <ChevronRight size={18} className="text-muted-foreground" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Action: New Listing */}
        <Button
          onPress={() => router.push('/(owner)/(tabs)/listings')}
          size="lg"
          className="w-full"
        >
          <PlusCircle size={18} color="white" className="mr-2" />
          <Text className="font-body-semibold text-body text-primary-foreground">
            Create New Property Listing
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
