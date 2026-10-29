import React from 'react';
import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Home } from 'lucide-react-native';
import { Button } from '@/components/ui/button';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: true }} />
      <View className="flex-1 items-center justify-center p-6 bg-background">
        <Text className="text-display font-heading text-primary mb-2">404</Text>
        <Text className="text-h3 font-heading text-foreground mb-2">
          This screen doesn&apos;t exist.
        </Text>
        <Text className="font-body text-sm text-muted-foreground text-center mb-6">
          The link you followed may be broken, or the page may have been removed.
        </Text>
        <Link href="/" asChild>
          <Button variant="default" size="default">
            <Home size={18} color="white" className="mr-2" />
            <Text className="text-primary-foreground font-body-semibold">Go to Home</Text>
          </Button>
        </Link>
      </View>
    </>
  );
}
