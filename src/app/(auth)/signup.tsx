import React from 'react';
import { AuthWelcomeScreen } from '@/features/auth/screens/auth-welcome-screen';

export default function SignUpScreen() {
  return <AuthWelcomeScreen initialMode="signup" />;
}

