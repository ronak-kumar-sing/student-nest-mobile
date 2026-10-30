import '../global.css';
import '@/i18n';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  useFonts as useJakartaFonts,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from '@/components/ui/toast';
import { OfflineBanner } from '@/components/common/offline-banner';
import { setReducedMotion } from '@/lib/haptics';
import { useReducedMotion } from 'react-native-reanimated';

// Prevent splash screen from auto-hiding until assets are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

export default function RootLayout() {
  const [interLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [jakartaLoaded] = useJakartaFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    setReducedMotion(Boolean(isReducedMotion));
  }, [isReducedMotion]);

  useEffect(() => {
    if (interLoaded && jakartaLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [interLoaded, jakartaLoaded]);

  if (!interLoaded || !jakartaLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(student)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(owner)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="property/[id]"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="booking/[id]"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen name="tour/[id]" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen
              name="chat/[threadId]"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen name="dev" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
          </Stack>
          <Toaster />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
