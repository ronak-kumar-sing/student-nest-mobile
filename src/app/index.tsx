import React from 'react';
import { Redirect } from 'expo-router';
import { useSessionStore } from '@/stores/session';

export default function Index() {
  const { isAuthenticated, role } = useSessionStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  if (role === 'owner') {
    return <Redirect href="/(owner)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(student)/(tabs)/explore" />;
}
