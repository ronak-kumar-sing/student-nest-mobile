import React from 'react';
import '@/i18n';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoommatesScreen } from '@/features/roommates/screens/roommates-screen';
import { roommatesApi } from '@/features/roommates/api';
import type { RoommateProfileDto, RoommateMatchesDto } from '@/features/roommates/types';

// Minimal local mocks
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return {
    FlashList: (props: Record<string, unknown>) => <FlatList {...props} />,
  };
});

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = require('react-native');
  const React = require('react');
  const BottomSheet = React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      expand: jest.fn(),
      close: jest.fn(),
      snapToIndex: jest.fn(),
    }));
    return <View testID="mock-bottom-sheet">{props.children as React.ReactNode}</View>;
  });
  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetView: (props: Record<string, unknown>) => <View {...props} />,
    BottomSheetBackdrop: () => null,
  };
});

jest.mock('@/components/ui/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
  Toaster: () => null,
}));

jest.mock('@/lib/haptics', () => ({
  selectionFeedback: jest.fn(),
  mediumImpact: jest.fn(),
}));

jest.mock('@/features/roommates/components/match-card-skeleton', () => {
  const { View } = require('react-native');
  return {
    MatchCardSkeleton: () => <View testID="match-card-skeleton" />,
  };
});

jest.mock('@/features/roommates/api', () => ({
  roommatesApi: {
    getProfile: jest.fn(),
    upsertProfile: jest.fn(),
    setProfileActive: jest.fn(),
    getMatches: jest.fn(),
    sendRequest: jest.fn(),
    listRequests: jest.fn(),
    actOnRequest: jest.fn(),
  },
}));

describe('RoommatesScreen RNTL state flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const mockActiveProfile: RoommateProfileDto = {
    citySlug: 'indore',
    preferredLocalities: ['vijay-nagar'],
    budgetMinPaise: 600000,
    budgetMaxPaise: 800000,
    moveInBy: '2026-12-01',
    gender: 'male',
    preferredGender: 'any',
    lifestyle: {
      smoking: false,
      drinking: false,
      pets: false,
      diet: 'veg',
      sleepSchedule: 'early',
      cleanliness: 4,
      guests: 'sometimes',
      studyHabits: 'quiet',
    },
    bio: 'Rahul student',
    interests: ['music', 'reading'],
    college: 'IIPS Indore',
    isActive: true,
    createdAt: '2026-11-28T00:00:00.000Z',
    updatedAt: '2026-11-28T00:00:00.000Z',
  };

  const mockMatches: RoommateMatchesDto = {
    items: [
      {
        profile: {
          id: 'stud_asha',
          displayName: 'Asha V.',
          avatarUrl: null,
          citySlug: 'indore',
          preferredLocalities: ['vijay-nagar'],
          budgetMinPaise: 600000,
          budgetMaxPaise: 800000,
          moveInBy: '2026-12-01',
          gender: 'female',
          preferredGender: 'any',
          lifestyle: {
            smoking: false,
            drinking: false,
            pets: false,
            diet: 'veg',
            sleepSchedule: 'early',
            cleanliness: 4,
            guests: 'sometimes',
            studyHabits: 'quiet',
          },
          bio: 'CS Student',
          interests: ['music'],
        },
        score: 86,
        reasons: ['Budgets overlap ₹6,000–₹8,000', 'Both vegetarian'],
      },
    ],
    computedAt: '2026-11-28T00:00:00.000Z',
  };

  it('shows roommates-skeleton when profile is loading, then renders match list with "86% match"', async () => {
    const mockGetProfile = roommatesApi.getProfile as jest.Mock;
    const mockGetMatches = roommatesApi.getMatches as jest.Mock;

    let resolveProfile: (val: RoommateProfileDto | null) => void;
    const profilePromise = new Promise<RoommateProfileDto | null>((res) => {
      resolveProfile = res;
    });

    mockGetProfile.mockReturnValue(profilePromise);
    mockGetMatches.mockResolvedValue(mockMatches);

    await render(
      <QueryClientProvider client={queryClient}>
        <RoommatesScreen />
      </QueryClientProvider>,
    );

    // Initial state: profile loading shows roommates-skeleton
    expect(screen.getByTestId('roommates-skeleton')).toBeTruthy();

    // Resolve profile
    await act(async () => {
      resolveProfile!(mockActiveProfile);
    });

    // After resolving, matches should be loaded and "86% match" should be displayed
    await waitFor(() => {
      expect(screen.getByTestId('roommates-matches-list')).toBeTruthy();
      expect(screen.getByText('86% match')).toBeTruthy();
    });
  });

  it('shows roommates-intro when user has no profile (null)', async () => {
    const mockGetProfile = roommatesApi.getProfile as jest.Mock;
    mockGetProfile.mockResolvedValueOnce(null);

    await render(
      <QueryClientProvider client={queryClient}>
        <RoommatesScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('roommates-intro')).toBeTruthy();
      expect(screen.getByText('Find your ideal college roommate')).toBeTruthy();
    });
  });

  it('shows roommates-empty when there are no matches for an active profile', async () => {
    const mockGetProfile = roommatesApi.getProfile as jest.Mock;
    const mockGetMatches = roommatesApi.getMatches as jest.Mock;

    mockGetProfile.mockResolvedValueOnce(mockActiveProfile);
    mockGetMatches.mockResolvedValueOnce({
      items: [],
      computedAt: '2026-11-28T00:00:00.000Z',
    });

    await render(
      <QueryClientProvider client={queryClient}>
        <RoommatesScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('roommates-empty')).toBeTruthy();
      expect(screen.getByText('No matches yet')).toBeTruthy();
    });
  });

  it('shows roommates-hidden-banner when profile exists but isActive is false', async () => {
    const mockGetProfile = roommatesApi.getProfile as jest.Mock;
    mockGetProfile.mockResolvedValueOnce({
      ...mockActiveProfile,
      isActive: false,
    });

    await render(
      <QueryClientProvider client={queryClient}>
        <RoommatesScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('roommates-hidden-banner')).toBeTruthy();
      expect(
        screen.getByText('Your profile is hidden, matches are paused'),
      ).toBeTruthy();
    });
  });
});
