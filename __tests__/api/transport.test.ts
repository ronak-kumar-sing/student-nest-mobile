import { bindTransport } from '@/api/transport';
import { useDevSettingsStore } from '@/stores/dev-settings';

jest.mock('@/lib/storage', () => {
  const store = new Map<string, string>();
  return {
    zustandStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
    storage: {
      getString: (key: string) => store.get(key),
      set: (key: string, value: string) => store.set(key, String(value)),
      remove: (key: string) => store.delete(key),
      getAllKeys: () => Array.from(store.keys()),
      clearAll: () => store.clear(),
    },
  };
});

jest.mock('@/lib/firebase', () => ({
  getCurrentIdToken: jest.fn().mockResolvedValue(null),
}));

describe('bindTransport', () => {
  const originalEnvMode = process.env.EXPO_PUBLIC_API_MODE;

  beforeEach(() => {
    useDevSettingsStore.getState().resetAll();
    delete process.env.EXPO_PUBLIC_API_MODE;
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_API_MODE = originalEnvMode;
  });

  it('evaluates transport mode at call time and switches immediately without re-binding', async () => {
    const mockImpl = {
      fetchListings: jest.fn().mockResolvedValue(['mock-listing-1', 'mock-listing-2']),
      label: 'mock-version',
    };

    const httpImpl = {
      fetchListings: jest.fn().mockResolvedValue(['http-listing-1']),
      label: 'http-version',
    };

    const api = bindTransport('properties', {
      mock: mockImpl,
      http: httpImpl,
    });

    // 1. Initially default is 'mock'
    const result1 = await api.fetchListings();
    expect(result1).toEqual(['mock-listing-1', 'mock-listing-2']);
    expect(mockImpl.fetchListings).toHaveBeenCalledTimes(1);
    expect(httpImpl.fetchListings).not.toHaveBeenCalled();
    expect(api.label).toBe('mock-version');

    // 2. Switch override to 'http' at runtime
    useDevSettingsStore.getState().setApiMode('properties', 'http');

    const result2 = await api.fetchListings();
    expect(result2).toEqual(['http-listing-1']);
    expect(httpImpl.fetchListings).toHaveBeenCalledTimes(1);
    expect(mockImpl.fetchListings).toHaveBeenCalledTimes(1);
    expect(api.label).toBe('http-version');

    // 3. Switch back to 'mock'
    useDevSettingsStore.getState().setApiMode('properties', 'mock');

    const result3 = await api.fetchListings();
    expect(result3).toEqual(['mock-listing-1', 'mock-listing-2']);
    expect(mockImpl.fetchListings).toHaveBeenCalledTimes(2);
    expect(httpImpl.fetchListings).toHaveBeenCalledTimes(1);
    expect(api.label).toBe('mock-version');
  });

  it('respects global EXPO_PUBLIC_API_MODE when no feature override is set', async () => {
    const mockImpl = {
      getMe: jest.fn().mockResolvedValue({ id: 'mock-user' }),
    };
    const httpImpl = {
      getMe: jest.fn().mockResolvedValue({ id: 'http-user' }),
    };

    const userApi = bindTransport('users', {
      mock: mockImpl,
      http: httpImpl,
    });

    process.env.EXPO_PUBLIC_API_MODE = 'http';
    const httpRes = await userApi.getMe();
    expect(httpRes).toEqual({ id: 'http-user' });
    expect(httpImpl.getMe).toHaveBeenCalledTimes(1);

    process.env.EXPO_PUBLIC_API_MODE = 'mock';
    const mockRes = await userApi.getMe();
    expect(mockRes).toEqual({ id: 'mock-user' });
    expect(mockImpl.getMe).toHaveBeenCalledTimes(1);
  });
});
