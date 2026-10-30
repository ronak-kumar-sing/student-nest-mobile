import React from 'react';
import { AuthWelcomeScreen } from '@/features/auth/screens/auth-welcome-screen';

export default function LoginScreen() {
  return <AuthWelcomeScreen initialMode="signin" />;
}

