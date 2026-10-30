import React from 'react';
import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Home } from 'lucide-react-native';
import { Button } from '@/components/ui/button';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="mb-2 font-heading text-display text-primary">404</Text>
        <Text className="mb-2 font-heading text-h3 text-foreground">
          This screen doesn&apos;t exist.
        </Text>
        <Text className="mb-6 text-center font-body text-sm text-muted-foreground">
          The link you followed may be broken, or the page may have been removed.
        </Text>
        <Link href="/" asChild>
          <Button variant="default" size="default">
            <Home size={18} color="white" className="mr-2" />
            <Text className="font-body-semibold text-primary-foreground">Go to Home</Text>
          </Button>
        </Link>
      </View>
    </>
  );
}
