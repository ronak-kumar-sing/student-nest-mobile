import React from 'react';
import { Tabs } from 'expo-router';
import { Search, Heart, CalendarClock, MessageSquare, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/tokens';
import {
  GlassTabBarBackground,
  floatingTabBarStyle,
  GlassTabButton,
  GlassTabIcon,
} from '@/components/common/glass-tab-bar';

export default function StudentTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarHideOnKeyboard: true,
        tabBarStyle: floatingTabBarStyle,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarButton: (props) => <GlassTabButton {...props} />,
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon
              icon={<Search size={20} color={color} strokeWidth={focused ? 2.4 : 2} />}
              focused={focused}
              accentColor={colors.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('tabs.saved'),
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon
              icon={<Heart size={20} color={color} strokeWidth={focused ? 2.4 : 2} />}
              focused={focused}
              accentColor={colors.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t('tabs.activity'),
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon
              icon={<CalendarClock size={20} color={color} strokeWidth={focused ? 2.4 : 2} />}
              focused={focused}
              accentColor={colors.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: t('tabs.inbox'),
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon
              icon={<MessageSquare size={20} color={color} strokeWidth={focused ? 2.4 : 2} />}
              focused={focused}
              accentColor={colors.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon
              icon={<User size={20} color={color} strokeWidth={focused ? 2.4 : 2} />}
              focused={focused}
              accentColor={colors.primary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
