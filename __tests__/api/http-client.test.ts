import { apiRequest, http, createIdempotencyKey, getApiBaseUrl } from '@/api/http/client';
import { setAuthTokenProvider, resetAuthTokenProvider } from '@/api/http/token';
import { ApiError, ErrorCodes, isApiError } from '@/api/errors';
import { queryClient } from '@/api/query-client';

jest.mock('@/lib/firebase', () => ({
  getCurrentIdToken: jest.fn().mockResolvedValue(null),
  getFirebaseAuth: jest.fn().mockReturnValue({
    authStateReady: jest.fn().mockResolvedValue(undefined),
    currentUser: null,
  }),
  signInWithFirebaseCustomToken: jest.fn(),
  signOutFirebase: jest.fn(),
  subscribeToAuthState: jest.fn(),
  getIdTokenRole: jest.fn(),
}));

describe('HTTP Client & Query Client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
    setAuthTokenProvider(jest.fn().mockResolvedValue('test-mock-token'));
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    resetAuthTokenProvider();
  });

  describe('getApiBaseUrl', () => {
    const originalEnv = process.env.EXPO_PUBLIC_API_URL;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.EXPO_PUBLIC_API_URL = originalEnv;
      } else {
        delete process.env.EXPO_PUBLIC_API_URL;
      }
    });

    it('strips trailing slashes from API base URL', () => {
      process.env.EXPO_PUBLIC_API_URL = 'http://api.studentnest.app///';
      expect(getApiBaseUrl()).toBe('http://api.studentnest.app');
    });

    it('defaults to http://localhost:3000 if not set', () => {
      delete process.env.EXPO_PUBLIC_API_URL;
      expect(getApiBaseUrl()).toBe('http://localhost:3000');
    });
  });

  describe('createIdempotencyKey', () => {
    it('returns a valid UUID v4 format string', () => {
      const key = createIdempotencyKey();
      expect(typeof key).toBe('string');
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('apiRequest and http methods', () => {
    it('attaches Bearer token to request headers', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ ok: true }),
      } as unknown as Response);

      globalThis.fetch = fetchMock;

      const result = await http.get<{ ok: boolean }>('/v1/users/me');

      expect(result).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/v1/users/me');
      expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-mock-token');
      expect((init.headers as Record<string, string>)['Accept']).toBe('application/json');
    });

    it('serializes query arrays as repeated keys and skips null/undefined/empty string', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ items: [] }),
      } as unknown as Response);

      globalThis.fetch = fetchMock;

      await http.get('/v1/search', {
        query: {
          city: 'indore',
          roomType: ['pg', '1rk'],
          empty: '',
          nullVal: null,
          undefVal: undefined,
        },
      });

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:3000/v1/search?city=indore&roomType=pg&roomType=1rk');
    });

    it('sends JSON body and Content-Type header on POST', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ id: 'item_1' }),
      } as unknown as Response);

      globalThis.fetch = fetchMock;

      const body = { title: 'Room near campus', rentPaise: 850000 };
      const res = await http.post('/v1/properties', body);

      expect(res).toEqual({ id: 'item_1' });
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
      expect(init.body).toBe(JSON.stringify(body));
    });

    it('passes Idempotency-Key header when provided', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ bookingId: 'bk_123' }),
      } as unknown as Response);

      globalThis.fetch = fetchMock;

      await http.post('/v1/bookings', { moveInDate: '2026-12-01' }, { idempotencyKey: 'test-idemp-key-123' });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('test-idemp-key-123');
    });

    it('parses error envelope into ApiError with top-level requestId and details array', async () => {
      const errorPayload = {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Input validation failed',
          details: [{ field: 'moveInDate', issue: 'must be an ISO string' }],
        },
        requestId: 'req_01J9Z3K',
      };

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: async () => errorPayload,
      } as unknown as Response);

      await expect(http.post('/v1/bookings', {})).rejects.toThrow(ApiError);

      try {
        await http.post('/v1/bookings', {});
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.code).toBe('VALIDATION_FAILED');
          expect(err.message).toBe('Input validation failed');
          expect(err.statusCode).toBe(400);
          expect(err.requestId).toBe('req_01J9Z3K');
          expect(err.details).toEqual([{ field: 'moveInDate', issue: 'must be an ISO string' }]);
        }
      }
    });

    it('falls back to status-based code when error body is non-JSON', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        json: async () => {
          throw new Error('Not valid JSON');
        },
      } as unknown as Response);

      try {
        await http.get('/v1/missing');
        fail('Should have thrown');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.code).toBe(ErrorCodes.NOT_FOUND);
          expect(err.statusCode).toBe(404);
          expect(err.message).toBe('Not Found');
        }
      }
    });

    it('exposes Retry-After header as retryAfterSec on 429 response', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'retry-after': '45' }),
        json: async () => ({
          error: { code: 'RATE_LIMITED', message: 'Too many requests' },
          requestId: 'req_429',
        }),
      } as unknown as Response);

      try {
        await http.get('/v1/search');
        fail('Should have thrown');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.code).toBe(ErrorCodes.RATE_LIMITED);
          expect(err.statusCode).toBe(429);
          expect(err.retryAfterSec).toBe(45);
        }
      }
    });

    it('maps generic fetch rejection to NETWORK_ERROR with statusCode 0', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

      try {
        await http.get('/v1/properties');
        fail('Should have thrown');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.code).toBe(ErrorCodes.NETWORK_ERROR);
          expect(err.statusCode).toBe(0);
          expect(err.message).toBe('Connection refused');
        }
      }
    });

    it('re-throws abort errors unchanged without wrapping into ApiError', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      globalThis.fetch = jest.fn().mockRejectedValue(abortError);

      try {
        await http.get('/v1/properties');
        fail('Should have thrown');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(false);
        expect(err).toBe(abortError);
      }
    });

    it('triggers one forced token refresh and retries once on 401 response', async () => {
      const tokenProvider = jest
        .fn()
        .mockImplementation(async ({ forceRefresh }: { forceRefresh: boolean }) => {
          return forceRefresh ? 'fresh-refreshed-token' : 'stale-token';
        });

      setAuthTokenProvider(tokenProvider);

      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers(),
          json: async () => ({
            error: { code: 'UNAUTHENTICATED', message: 'Token expired' },
            requestId: 'req_unauth_1',
          }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => JSON.stringify({ refreshed: true }),
        } as unknown as Response);

      globalThis.fetch = fetchMock;

      const result = await http.get<{ refreshed: boolean }>('/v1/users/me');

      expect(result).toEqual({ refreshed: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      expect(tokenProvider).toHaveBeenCalledWith({ forceRefresh: false });
      expect(tokenProvider).toHaveBeenCalledWith({ forceRefresh: true });

      const [, firstCallInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect((firstCallInit.headers as Record<string, string>)['Authorization']).toBe('Bearer stale-token');

      const [, secondCallInit] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect((secondCallInit.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer fresh-refreshed-token',
      );
    });

    it('throws UNAUTHENTICATED with statusCode 401 without calling fetch when auth: required and no token', async () => {
      setAuthTokenProvider(jest.fn().mockResolvedValue(null));
      const fetchMock = jest.fn();
      globalThis.fetch = fetchMock;

      try {
        await http.get('/v1/users/me', { auth: 'required' });
        fail('Should have thrown');
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.code).toBe(ErrorCodes.UNAUTHENTICATED);
          expect(err.statusCode).toBe(401);
        }
      }

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('allows auth: optional without token without throwing', async () => {
      setAuthTokenProvider(jest.fn().mockResolvedValue(null));
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ results: [] }),
      } as unknown as Response);

      globalThis.fetch = fetchMock;

      const result = await http.get('/v1/search/rooms', { auth: 'optional' });
      expect(result).toEqual({ results: [] });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
    });

    it('returns undefined on 204 No Content response', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
      } as unknown as Response);

      const res = await http.delete('/v1/users/me');
      expect(res).toBeUndefined();
    });
  });

  describe('queryClient retry policy', () => {
    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean;

    it('does not retry after 2 failures', () => {
      expect(retryFn(2, new Error('Generic error'))).toBe(false);
      expect(retryFn(3, new Error('Generic error'))).toBe(false);
    });

    it('does not retry AbortError', () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      expect(retryFn(0, abortError)).toBe(false);
    });

    it('does not retry 4xx ApiErrors except 408 and 429', () => {
      const err400 = new ApiError({ code: 'VALIDATION_FAILED', message: '', statusCode: 400 });
      const err401 = new ApiError({ code: 'UNAUTHENTICATED', message: '', statusCode: 401 });
      const err403 = new ApiError({ code: 'FORBIDDEN', message: '', statusCode: 403 });
      const err404 = new ApiError({ code: 'NOT_FOUND', message: '', statusCode: 404 });

      expect(retryFn(0, err400)).toBe(false);
      expect(retryFn(0, err401)).toBe(false);
      expect(retryFn(0, err403)).toBe(false);
      expect(retryFn(0, err404)).toBe(false);

      const err408 = new ApiError({ code: 'TIMEOUT', message: '', statusCode: 408 });
      const err429 = new ApiError({ code: 'RATE_LIMITED', message: '', statusCode: 429 });

      expect(retryFn(0, err408)).toBe(true);
      expect(retryFn(0, err429)).toBe(true);
    });

    it('retries 5xx server errors and network errors', () => {
      const err500 = new ApiError({ code: 'INTERNAL_ERROR', message: '', statusCode: 500 });
      const errNetwork = new ApiError({ code: 'NETWORK_ERROR', message: '', statusCode: 0 });

      expect(retryFn(0, err500)).toBe(true);
      expect(retryFn(1, err500)).toBe(true);
      expect(retryFn(0, errNetwork)).toBe(true);
    });
  });
});
