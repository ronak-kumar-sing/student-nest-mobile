import { createIdempotencyKey, http, type Page, type QueryValue } from '@/api/http';
import { bindTransport } from '@/api/transport';
import { addBooking as addBookingDb, getDB, updateBookingStatus } from '@/api/mock/db';
import { simulateLatency } from '@/api/mock/latency';
import { createMockError, getInjectedError, shouldInjectError } from '@/api/mock/errors';
import { ErrorCodes } from '@/api/errors';
import { getMockCurrentUserId, mockBookingToBookingDto } from '@/api/mock/adapters';
import type { BookingActionDto, BookingDto, CreateBookingDto } from './types';

export interface BookingsApi {
  getBookings(
    params?: { status?: string; cursor?: string | null; limit?: number },
    signal?: AbortSignal,
  ): Promise<Page<BookingDto>>;
  getBooking(id: string, signal?: AbortSignal): Promise<BookingDto>;
  createBooking(
    input: CreateBookingDto,
    idempotencyKey?: string,
    signal?: AbortSignal,
  ): Promise<BookingDto>;
  actOnBooking(
    id: string,
    action: BookingActionDto,
    signal?: AbortSignal,
  ): Promise<BookingDto>;
}

// ─── HTTP Implementation ────────────────────────────────────────────

export const httpBookingsApi: BookingsApi = {
  async getBookings(params, signal) {
    const response = await http.get<Page<BookingDto>>('/v1/bookings', {
      query: {
        status: params?.status ?? undefined,
        cursor: params?.cursor ?? undefined,
        limit: params?.limit ?? undefined,
      } as Record<string, QueryValue>,
      signal,
      auth: 'required',
    });

    const nextCursor =
      typeof response.nextCursor === 'string'
        ? response.nextCursor
        : null;

    return {
      items: response.items,
      nextCursor,
      hasMore: response.hasMore,
    };
  },

  async getBooking(id, signal) {
    return http.get<BookingDto>(`/v1/bookings/${id}`, {
      signal,
      auth: 'required',
    });
  },

  async createBooking(input, idempotencyKey, signal) {
    const key = idempotencyKey ?? createIdempotencyKey();
    return http.post<BookingDto>('/v1/bookings', input, {
      idempotencyKey: key,
      signal,
      auth: 'required',
    });
  },

  async actOnBooking(id, action, signal) {
    return http.post<BookingDto>(`/v1/bookings/${id}/actions`, action, {
      signal,
      auth: 'required',
    });
  },
};

// ─── Mock Implementation ────────────────────────────────────────────

function encodeCursor(offset: number): string {
  return typeof btoa === 'function' ? btoa(String(offset)) : String(offset);
}

function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try {
    const raw = typeof atob === 'function' ? atob(cursor) : cursor;
    const num = parseInt(raw, 10);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

export const mockBookingsApi: BookingsApi = {
  async getBookings(params, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }

    const db = getDB();
    const currentUserId = getMockCurrentUserId('student');
    let userBookings = db.bookings.filter((b) => b.studentId === currentUserId);

    if (params?.status) {
      userBookings = userBookings.filter((b) => b.status === params.status);
    }

    const limit = params?.limit ?? 20;
    const offset = decodeCursor(params?.cursor);
    const total = userBookings.length;
    const paged = userBookings.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    const nextCursor = hasMore ? encodeCursor(offset + limit) : null;

    return {
      items: paged.map((b) => mockBookingToBookingDto(b)),
      nextCursor,
      hasMore,
    };
  },

  async getBooking(id, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }

    const db = getDB();
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) {
      throw createMockError(404, ErrorCodes.NOT_FOUND, 'Booking not found');
    }

    return mockBookingToBookingDto(booking);
  },

  async createBooking(input, _idempotencyKey, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }

    const db = getDB();
    const property = db.properties.find((p) => p.id === input.propertyId);
    if (!property || property.status !== 'published') {
      throw createMockError(
        404,
        ErrorCodes.PROPERTY_UNAVAILABLE,
        'Property is unavailable or not found',
      );
    }

    const currentUserId = getMockCurrentUserId('student');

    // Duplicate application check
    const hasExisting = db.bookings.some(
      (b) =>
        b.propertyId === input.propertyId &&
        b.studentId === currentUserId &&
        (b.status === 'pending' || b.status === 'approved'),
    );

    if (hasExisting) {
      throw createMockError(
        409,
        ErrorCodes.DUPLICATE_APPLICATION,
        'You have already applied for this room',
      );
    }

    const newBookingId = `booking-${Date.now()}`;
    const newBooking = {
      id: newBookingId,
      propertyId: input.propertyId,
      studentId: currentUserId,
      ownerId: property.ownerId,
      status: 'pending' as const,
      moveInDate: input.moveInDate,
      durationMonths: input.durationMonths,
      occupants: input.occupants ?? 1,
      agreedRentPaise: property.rentPaise,
      createdAt: new Date().toISOString(),
      history: [
        {
          status: 'pending',
          at: new Date().toISOString(),
          by: currentUserId,
          note: input.message,
        },
      ],
    };

    addBookingDb(newBooking);

    return mockBookingToBookingDto(newBooking);
  },

  async actOnBooking(id, action, _signal) {
    await simulateLatency();
    if (shouldInjectError()) {
      throw getInjectedError();
    }

    const db = getDB();
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) {
      throw createMockError(404, ErrorCodes.NOT_FOUND, 'Booking not found');
    }

    const currentUserId = getMockCurrentUserId('student');
    const validStatus = action.action as typeof booking.status;
    updateBookingStatus(id, validStatus, currentUserId, action.note);

    const updated = db.bookings.find((b) => b.id === id)!;
    return mockBookingToBookingDto(updated);
  },
};

export const bookingsApi = bindTransport('bookings', {
  mock: mockBookingsApi,
  http: httpBookingsApi,
});
