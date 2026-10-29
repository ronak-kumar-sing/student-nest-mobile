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
      <View className="px-4 py-3 bg-card border-b border-border">
        <Text className="text-h2 font-heading text-foreground">{t('tabs.inbox')}</Text>

        {/* Segmented Control */}
        <View className="flex-row bg-muted p-1 rounded-xl mt-3">
          <TouchableOpacity
            onPress={() => setActiveTab('messages')}
            className={cn(
              'flex-1 py-2 rounded-lg items-center',
              activeTab === 'messages' ? 'bg-card shadow-elevation-1' : '',
            )}
          >
            <Text
              className={cn(
                'text-xs font-body-semibold',
                activeTab === 'messages' ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              Messages ({inquiries.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('notifications')}
            className={cn(
              'flex-1 py-2 rounded-lg items-center flex-row justify-center',
              activeTab === 'notifications' ? 'bg-card shadow-elevation-1' : '',
            )}
          >
            <Text
              className={cn(
                'text-xs font-body-semibold mr-1.5',
                activeTab === 'notifications' ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              Notifications
            </Text>
            {unreadNotifs > 0 && (
              <View className="bg-destructive px-1.5 py-0.2 rounded-full">
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
                    className="bg-card rounded-xl border border-border p-4 flex-row items-center justify-between shadow-elevation-1"
                    activeOpacity={0.8}
                  >
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-body font-body-semibold text-foreground">
                          {owner?.displayName ?? 'Verified Owner'}
                        </Text>
                        <Text className="text-[11px] font-body text-muted-foreground">
                          {formatRelativeIST(inquiry.updatedAt)}
                        </Text>
                      </View>

                      <Text className="text-xs font-body-medium text-primary mb-1">
                        {property?.title ?? 'Room listing'}
                      </Text>

                      <Text
                        className="text-xs font-body text-muted-foreground"
                        numberOfLines={1}
                      >
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
                  notif.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20',
                )}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-body font-body-semibold text-foreground">
                    {notif.title}
                  </Text>
                  <Text className="text-[11px] font-body text-muted-foreground">
                    {formatRelativeIST(notif.createdAt)}
                  </Text>
                </View>
                <Text className="text-xs font-body text-muted-foreground leading-5">
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
