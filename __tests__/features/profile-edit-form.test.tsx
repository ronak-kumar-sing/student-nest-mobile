import React from 'react';
import '@/i18n';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileEditScreen } from '@/features/users/screens/profile-edit-screen';
import { usersApi } from '@/features/users/api';
import type { UserMeDto } from '@/features/users/types';
import { useSessionStore } from '@/stores/session';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('@/components/ui/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
  Toaster: () => null,
}));

jest.mock('@/lib/haptics', () => ({
  selectionFeedback: jest.fn(),
  mediumImpact: jest.fn(),
}));

jest.mock('react-native-keyboard-controller', () => {
  const { ScrollView } = require('react-native');
  return {
    KeyboardAwareScrollView: (props: Record<string, unknown>) => <ScrollView {...props} />,
  };
});

// Skeleton uses Reanimated, which needs native worklets under Jest.
jest.mock('@/components/ui/skeleton', () => {
  const { View } = require('react-native');
  return { Skeleton: () => <View testID="skeleton" /> };
});

jest.mock('@/features/users/api', () => ({
  usersApi: {
    getMe: jest.fn(),
    updateMe: jest.fn(),
    becomeOwner: jest.fn(),
  },
}));

describe('ProfileEditScreen RNTL form validation and submission', () => {
  let queryClient: QueryClient;

  const initialUser: UserMeDto = {
    id: 'student-1',
    role: 'student',
    status: 'active',
    email: 'rahul.sharma@example.com',
    emailVerified: true,
    phone: '+919876543210',
    phoneVerified: true,
    displayName: 'Rahul Sharma',
    avatarUrl: null,
    bio: 'Pre-final year student at IIPS.',
    gender: 'male',
    college: 'IIPS Indore',
    city: 'indore',
    claims: { role: 'student', status: 'active' },
    notificationPrefs: { channels: { email: true, sms: false, push: true }, types: {} },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // useMyProfile only runs for an authenticated session.
    useSessionStore.setState({
      isAuthenticated: true,
      role: 'student',
      user: {
        id: 'student-1',
        email: 'rahul.sharma@example.com',
        displayName: 'Rahul Sharma',
        avatarUrl: null,
        phone: '+919876543210',
        role: 'student',
      },
    });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    });

    (usersApi.getMe as jest.Mock).mockResolvedValue(initialUser);
    (usersApi.updateMe as jest.Mock).mockResolvedValue({
      ...initialUser,
      displayName: 'Rahul S.',
      college: 'SGSITS',
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('clearing the name to one character and pressing Save shows a validation error and does not call updateMe', async () => {
    await render(
      <QueryClientProvider client={queryClient}>
        <ProfileEditScreen />
      </QueryClientProvider>,
    );

    // Wait for the form to populate from useMyProfile
    const nameInput = await waitFor(() => screen.getByTestId('profile-edit-name'));
    expect(nameInput.props.value).toBe('Rahul Sharma');

    const saveButton = screen.getByTestId('profile-edit-save');

    // Change name to 1 character (invalid: min 2 required)
    await fireEvent.changeText(nameInput, 'R');
    await fireEvent.press(saveButton);

    // Assert validation error appears inline
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeTruthy();
    });

    // Assert updateMe is NOT called
    expect(usersApi.updateMe).not.toHaveBeenCalled();
  });

  it('changing the name and the college then Save calls updateMe with only { displayName, college }', async () => {
    await render(
      <QueryClientProvider client={queryClient}>
        <ProfileEditScreen />
      </QueryClientProvider>,
    );

    // Wait for initial population
    const nameInput = await waitFor(() => screen.getByTestId('profile-edit-name'));
    await waitFor(() => expect(nameInput.props.value).toBe('Rahul Sharma'));

    const collegeInput = screen.getByTestId('profile-edit-college');
    await waitFor(() => expect(collegeInput.props.value).toBe('IIPS Indore'));

    const saveButton = screen.getByTestId('profile-edit-save');

    // Change name and college
    await fireEvent.changeText(nameInput, 'Rahul S.');
    await fireEvent.changeText(collegeInput, 'SGSITS');

    // Press save
    await fireEvent.press(saveButton);

    // Assert updateMe is called with only changed fields
    await waitFor(() => {
      expect(usersApi.updateMe).toHaveBeenCalledWith({
        displayName: 'Rahul S.',
        college: 'SGSITS',
      });
    });
  });
});
