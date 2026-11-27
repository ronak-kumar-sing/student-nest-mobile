import React from 'react';
import '@/i18n';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/api/errors';
import { SavedScreen } from '@/features/favorites/screens/saved-screen';
import { favoritesApi } from '@/features/favorites/api';

// Minimal local mocks
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return {
    FlashList: (props: Record<string, unknown>) => <FlatList {...props} />,
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: Record<string, unknown>) => <View {...props} testID="mock-expo-image" />,
  };
});

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
  // No-op: focus refetches would consume the mocked responses.
  useFocusEffect: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Skeletons use Reanimated, which needs native worklets; stub them with a testID.
jest.mock('@/components/common/list-skeletons', () => {
  const { View } = require('react-native');
  return {
    SavedCardSkeleton: () => <View testID="saved-card-skeleton" />,
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

jest.mock('@/features/favorites/api', () => ({
  favoritesApi: {
    getFavorites: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
  },
}));

describe('SavedScreen RNTL state flow', () => {
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

  it('transitions from error state to retry and empty state', async () => {
    const mockGetFavorites = favoritesApi.getFavorites as jest.Mock;

    // 1. First call fails with an ApiError
    mockGetFavorites.mockRejectedValueOnce(
      new ApiError({
        code: 'NETWORK_ERROR',
        message: 'Network error. Check your connection.',
        statusCode: 0,
      }),
    );

    // 2. Second call (on Retry) succeeds with an empty page
    mockGetFavorites.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
      hasMore: false,
    });

    await render(
      <QueryClientProvider client={queryClient}>
        <SavedScreen />
      </QueryClientProvider>,
    );

    // Loading: skeletons render on first load
    expect(screen.getAllByTestId('saved-card-skeleton').length).toBeGreaterThan(0);

    // Wait for the error state to appear
    const retryButton = await waitFor(() => screen.getByText('Retry'), { timeout: 5000 });
    expect(retryButton).toBeTruthy();

    // Trigger retry
    fireEvent.press(retryButton);

    // Assert that the empty state renders after successful retry
    const emptyStateTitle = await waitFor(() => screen.getByText('No saved properties yet'), { timeout: 5000 });
    expect(emptyStateTitle).toBeTruthy();
  });
});
