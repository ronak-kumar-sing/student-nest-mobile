import React from 'react';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  MessageSquare,
  User,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/tokens';
import {
  GlassTabBarBackground,
  floatingTabBarStyle,
  GlassTabButton,
  GlassTabIcon,
} from '@/components/common/glass-tab-bar';

export default function OwnerTabsLayout() {
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
        name="dashboard"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon
              icon={<LayoutDashboard size={20} color={color} strokeWidth={focused ? 2.4 : 2} />}
              focused={focused}
              accentColor={colors.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: t('tabs.listings'),
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon
              icon={<Building2 size={20} color={color} strokeWidth={focused ? 2.4 : 2} />}
              focused={focused}
              accentColor={colors.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: t('tabs.requests'),
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon
              icon={<ClipboardList size={20} color={color} strokeWidth={focused ? 2.4 : 2} />}
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
