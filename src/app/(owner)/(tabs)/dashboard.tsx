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

export default function OwnerDashboardScreen() {
  const db = getDB();
  const pendingRequests = db.bookings.filter((b) => b.ownerId === 'owner-1' && b.status === 'pending');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
        <View>
          <Text className="text-h2 font-heading text-foreground">Owner Portal</Text>
          <Text className="text-xs font-body text-muted-foreground">
            Manage listings & incoming tenant requests
          </Text>
        </View>
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
        {/* KYC Verification Banner */}
        <View className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-5 flex-row items-start">
          <AlertTriangle size={20} color="hsl(var(--warning))" className="mr-3 mt-0.5" />
          <View className="flex-1">
            <Text className="text-sm font-body-semibold text-warning mb-1">
              KYC Verification Required
            </Text>
            <Text className="text-xs font-body text-muted-foreground mb-3 leading-5">
              To publish listings and receive student applications, please complete your government ID verification.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(owner)/(tabs)/profile')}
              className="bg-warning px-3 py-1.5 rounded-lg self-start"
            >
              <Text className="text-xs font-body-semibold text-warning-foreground">
                Start KYC Verification
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 30-Day KPI Stats */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-body-semibold text-foreground">
              Last 30 Days Performance
            </Text>
            <View className="flex-row items-center">
              <TrendingUp size={14} color="hsl(var(--success))" className="mr-1" />
              <Text className="text-xs font-body-semibold text-success">+18%</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[45%] bg-card border border-border p-3.5 rounded-xl shadow-elevation-1">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-body text-muted-foreground">Listing Views</Text>
                <Eye size={16} className="text-primary" />
              </View>
              <Text className="text-h2 font-heading text-foreground">1,248</Text>
            </View>

            <View className="flex-1 min-w-[45%] bg-card border border-border p-3.5 rounded-xl shadow-elevation-1">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-body text-muted-foreground">Saves</Text>
                <Heart size={16} color="hsl(var(--destructive))" />
              </View>
              <Text className="text-h2 font-heading text-foreground">142</Text>
            </View>

            <View className="flex-1 min-w-[45%] bg-card border border-border p-3.5 rounded-xl shadow-elevation-1">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-body text-muted-foreground">Inquiries</Text>
                <MessageSquare size={16} className="text-info" />
              </View>
              <Text className="text-h2 font-heading text-foreground">28</Text>
            </View>

            <View className="flex-1 min-w-[45%] bg-card border border-border p-3.5 rounded-xl shadow-elevation-1">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-body text-muted-foreground">Bookings</Text>
                <CalendarCheck size={16} color="hsl(var(--success))" />
              </View>
              <Text className="text-h2 font-heading text-foreground">6</Text>
            </View>
          </View>
        </View>

        {/* Pending Requests Shortcut */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-body-semibold text-foreground">
              Pending Tenant Requests
            </Text>
            <TouchableOpacity onPress={() => router.push('/(owner)/(tabs)/requests')}>
              <Text className="text-xs font-body-semibold text-primary">View All</Text>
            </TouchableOpacity>
          </View>

          {pendingRequests.length === 0 ? (
            <View className="bg-card border border-border p-4 rounded-xl items-center">
              <Text className="text-xs font-body text-muted-foreground">
                No new pending applications right now.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(owner)/(tabs)/requests')}
              className="bg-card border border-border p-4 rounded-xl flex-row items-center justify-between shadow-elevation-1"
            >
              <View>
                <Text className="text-sm font-body-semibold text-foreground">
                  {pendingRequests.length} Booking Applications Awaiting Approval
                </Text>
                <Text className="text-xs font-body text-muted-foreground">
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
          <Text className="text-primary-foreground font-body-semibold text-body">
            Create New Property Listing
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
