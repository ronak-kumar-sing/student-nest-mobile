import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MessageSquare, Bell, ChevronRight } from 'lucide-react-native';
import { getDB } from '@/api/mock/db';
import { EmptyState } from '@/components/common/empty-state';
import { formatRelativeIST } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useTranslation } from 'react-i18next';

export default function InboxScreen() {
  const { t } = useTranslation();
  const db = getDB();
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');

  const inquiries = db.inquiries;
  const notifications = db.notifications;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-border bg-card px-4 py-3">
        <Text className="font-heading text-h2 text-foreground">{t('tabs.inbox')}</Text>

        {/* Segmented Control */}
        <View className="mt-3 flex-row rounded-xl bg-muted p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('messages')}
            className={cn(
              'flex-1 items-center rounded-lg py-2',
              activeTab === 'messages' ? 'shadow-elevation-1 bg-card' : 'bg-transparent',
            )}
          >
            <Text
              className={cn(
                'font-body-semibold text-xs',
                activeTab === 'messages' ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              Messages ({inquiries.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('notifications')}
            className={cn(
              'flex-1 flex-row items-center justify-center rounded-lg py-2',
              activeTab === 'notifications' ? 'shadow-elevation-1 bg-card' : 'bg-transparent',
            )}
          >
            <Text
              className={cn(
                'mr-1.5 font-body-semibold text-xs',
                activeTab === 'notifications' ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              Notifications
            </Text>
            {unreadNotifs > 0 && (
              <View className="py-0.2 rounded-full bg-destructive px-1.5">
                <Text className="text-[10px] font-bold text-destructive-foreground">
                  {unreadNotifs}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {activeTab === 'messages' ? (
          inquiries.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Contact owners directly from any room listing. Contact details are kept private."
              actionLabel="Find a Room"
              onAction={() => router.push('/(student)/(tabs)/explore')}
              icon={MessageSquare}
            />
          ) : (
            <View className="gap-2">
              {inquiries.map((inquiry) => {
                const property = db.properties.find((p) => p.id === inquiry.propertyId);
                const owner = db.users.find((u) => u.id === inquiry.ownerId);

                return (
                  <TouchableOpacity
                    key={inquiry.id}
                    onPress={() => router.push(`/chat/${inquiry.id}`)}
                    className="shadow-elevation-1 flex-row items-center justify-between rounded-xl border border-border bg-card p-4"
                    activeOpacity={0.8}
                  >
                    <View className="flex-1 pr-3">
                      <View className="mb-1 flex-row items-center justify-between">
                        <Text className="font-body-semibold text-body text-foreground">
                          {owner?.displayName ?? 'Verified Owner'}
                        </Text>
                        <Text className="font-body text-[11px] text-muted-foreground">
                          {formatRelativeIST(inquiry.updatedAt)}
                        </Text>
                      </View>

                      <Text className="mb-1 font-body-medium text-xs text-primary">
                        {property?.title ?? 'Room listing'}
                      </Text>

                      <Text className="font-body text-xs text-muted-foreground" numberOfLines={1}>
                        {inquiry.lastMessage}
                      </Text>
                    </View>

                    <ChevronRight size={16} className="text-muted-foreground" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        ) : notifications.length === 0 ? (
          <EmptyState
            title="All caught up"
            description="You will receive alerts here when owners reply to your booking applications or tours."
            icon={Bell}
          />
        ) : (
          <View className="gap-2">
            {notifications.map((notif) => (
              <View
                key={notif.id}
                className={cn(
                  'rounded-xl border p-4',
                  notif.read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5',
                )}
              >
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="font-body-semibold text-body text-foreground">
                    {notif.title}
                  </Text>
                  <Text className="font-body text-[11px] text-muted-foreground">
                    {formatRelativeIST(notif.createdAt)}
                  </Text>
                </View>
                <Text className="font-body text-xs leading-5 text-muted-foreground">
                  {notif.body}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
