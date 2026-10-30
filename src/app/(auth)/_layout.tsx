import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="email" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="role" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}
