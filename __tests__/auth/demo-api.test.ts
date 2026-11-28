import { httpAuthApi, mockAuthApi } from '@/features/auth/api';
import { ApiError } from '@/api/errors';
import { signInWithFirebaseCustomToken, getCurrentIdToken } from '@/lib/firebase';

jest.mock('@/lib/firebase', () => ({
  getCurrentIdToken: jest.fn().mockResolvedValue('test-refreshed-token'),
  signInWithFirebaseCustomToken: jest.fn().mockResolvedValue({ user: { uid: 'student-uid-1' } }),
  signOutFirebase: jest.fn().mockResolvedValue(undefined),
  getFirebaseAuth: jest.fn().mockReturnValue({
    authStateReady: jest.fn().mockResolvedValue(undefined),
    currentUser: null,
  }),
  subscribeToAuthState: jest.fn(),
  getIdTokenRole: jest.fn(),
}));

describe('Demo API (httpAuthApi & mockAuthApi)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  describe('httpAuthApi.getDemoConfig', () => {
    it('calls GET /v1/auth/demo without Authorization header and returns response body', async () => {
      const mockConfig = { enabled: true, personas: ['student' as const, 'owner' as const] };
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(mockConfig),
      } as unknown as Response);

      globalThis.fetch = fetchMock;

      const result = await httpAuthApi.getDemoConfig();

      expect(result).toEqual(mockConfig);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:3000/v1/auth/demo');
      expect(init.method).toBe('GET');
      expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
    });
  });

  describe('httpAuthApi.demoSignIn', () => {
    it('POSTs { persona: "student" } to /v1/auth/demo/sign-in without Authorization and signs in with Firebase', async () => {
      const mockResponse = {
        customToken: 'demo-custom-firebase-token-123',
        persona: 'student' as const,
        uid: 'demo-student-uid',
      };

      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(mockResponse),
      } as unknown as Response);

      globalThis.fetch = fetchMock;

      const res = await httpAuthApi.demoSignIn('student');

      expect(res).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:3000/v1/auth/demo/sign-in');
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
      expect(JSON.parse(init.body as string)).toEqual({ persona: 'student' });

      expect(signInWithFirebaseCustomToken).toHaveBeenCalledWith('demo-custom-firebase-token-123');
      expect(getCurrentIdToken).toHaveBeenCalledWith(true);
    });

    it('rejects with ApiError whose code is NOT_FOUND and does not call Firebase on 404 response', async () => {
      const errorPayload = {
        error: {
          code: 'NOT_FOUND',
          message: 'Demo mode is not available',
        },
        requestId: 'req_demo_404',
      };

      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => errorPayload,
      } as unknown as Response);

      globalThis.fetch = fetchMock;

      await expect(httpAuthApi.demoSignIn('owner')).rejects.toThrow(ApiError);

      try {
        await httpAuthApi.demoSignIn('owner');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe('NOT_FOUND');
        expect(apiErr.statusCode).toBe(404);
      }

      expect(signInWithFirebaseCustomToken).not.toHaveBeenCalled();
      expect(getCurrentIdToken).not.toHaveBeenCalled();
    });
  });

  describe('mockAuthApi demo methods', () => {
    it('reports enabled: false and empty personas for getDemoConfig', async () => {
      const config = await mockAuthApi.getDemoConfig();
      expect(config).toEqual({ enabled: false, personas: [] });
    });

    it('throws ApiError with NOT_FOUND on demoSignIn', async () => {
      await expect(mockAuthApi.demoSignIn('student')).rejects.toThrow(ApiError);
      try {
        await mockAuthApi.demoSignIn('student');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe('NOT_FOUND');
        expect(apiErr.statusCode).toBe(404);
      }
    });
  });
});
