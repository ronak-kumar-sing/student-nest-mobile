---
name: student-nest-mock-api
description: How to add a mock handler, fixture, or state transition, and how to flip a feature from mock to http transport.
---

# Student Nest Mock API

## Architecture

```
Screen → feature/queries.ts → feature/api.ts → getTransport(feature)
                                                ├── mock (src/api/mock/)
                                                └── http (src/api/client.ts)
```

### Transport selection

`src/api/mode.ts` controls which transport each feature uses:

```typescript
// Global default from env
const globalMode = process.env.EXPO_PUBLIC_API_MODE as 'mock' | 'http' ?? 'mock';

// Per-feature overrides (updated via dev menu at runtime)
const featureOverrides: Partial<Record<FeatureName, 'mock' | 'http'>> = {};

export function getTransportMode(feature: FeatureName): 'mock' | 'http' {
  return featureOverrides[feature] ?? globalMode;
}
```

In development builds, the dev menu screen (`/dev`) toggles modes at runtime and persists to Zustand/MMKV.

## Mock backend structure

```
src/api/mock/
├── db.ts              # In-memory store, seeded from fixtures
├── fixtures/
│   ├── users.ts       # 2 students, 1 verified owner, 1 unverified owner
│   ├── properties.ts  # 60 properties across 3 cities
│   ├── bookings.ts    # Every booking status
│   ├── tours.ts       # Every tour status
│   ├── inquiries.ts   # Threads with messages
│   ├── notifications.ts
│   ├── roommates.ts
│   └── reviews.ts
├── handlers/
│   ├── auth.ts
│   ├── users.ts
│   ├── properties.ts
│   ├── search.ts
│   ├── favorites.ts
│   ├── bookings.ts
│   ├── tours.ts
│   ├── inquiries.ts
│   ├── notifications.ts
│   ├── roommates.ts
│   ├── reviews.ts
│   ├── reports.ts
│   └── analytics.ts
├── latency.ts         # 300–900ms configurable delay
├── errors.ts          # Error injection utilities
└── events.ts          # EventEmitter for realtime simulation
```

## How to add a mock handler

1. **Read the backend spec** for the feature's endpoints, request/response shapes, status codes, and error codes.

2. **Add fixtures** in `src/api/mock/fixtures/<feature>.ts`:
   ```typescript
   import { faker } from '@faker-js/faker';
   faker.seed(42); // Deterministic

   export const seedBookings = (): Booking[] => [
     // One booking per status
     { id: 'booking-1', status: 'pending', ... },
     { id: 'booking-2', status: 'approved', ... },
   ];
   ```

3. **Register fixtures** in `db.ts`:
   ```typescript
   import { seedBookings } from './fixtures/bookings';
   // In the DB init:
   bookings: seedBookings(),
   ```

4. **Create the handler** in `src/api/mock/handlers/<feature>.ts`:
   ```typescript
   import { db } from '../db';
   import { simulateLatency } from '../latency';
   import { shouldInjectError, createError } from '../errors';

   export async function getBooking(id: string) {
     await simulateLatency();
     if (shouldInjectError()) throw createError(500);

     const booking = db.bookings.find(b => b.id === id);
     if (!booking) throw createError(404, 'NOT_FOUND');
     return booking;
   }
   ```

5. **Wire it into `feature/api.ts`**:
   ```typescript
   import { getTransportMode } from '@/api/mode';
   import * as mockHandlers from '@/api/mock/handlers/bookings';
   import { httpClient } from '@/api/client';

   export async function getBooking(id: string) {
     if (getTransportMode('bookings') === 'mock') {
       return mockHandlers.getBooking(id);
     }
     return httpClient.GET('/v1/bookings/{id}', { params: { path: { id } } });
   }
   ```

## State machines in mock mode

Implement the same state machines from the backend spec:

```typescript
const BOOKING_TRANSITIONS: Record<BookingStatus, BookingAction[]> = {
  pending: ['approve', 'reject', 'withdraw'],
  approved: ['check_in', 'cancel'],
  rejected: [],
  withdrawn: [],
  checked_in: ['complete'],
  completed: [],
  cancelled: [],
};

export function performBookingAction(id: string, action: BookingAction) {
  const booking = db.bookings.find(b => b.id === id);
  if (!booking) throw createError(404, 'NOT_FOUND');

  const allowed = BOOKING_TRANSITIONS[booking.status];
  if (!allowed.includes(action)) {
    throw createError(409, 'INVALID_TRANSITION');
  }
  // Apply transition...
}
```

## Realtime simulation

`src/api/mock/events.ts` provides a tiny event emitter that mimics Firestore listeners:

- Chat: "owner replies after 3s" simulation
- Notifications: new notification events
- Booking status: status change events

## Auth in mock mode

- Any email works
- OTP is always `000000`
- Phone verification is a fake confirm
- Session lives in Zustand store

## Auto-approvals in mock mode

- KYC: `draft → submitted → approved` auto-approves after 10 seconds
- Listing: `pending_review → published` auto-approves after 10 seconds

## Fixture data guidelines

- **3 cities:** Indore, Bengaluru, Pune
- **60 properties** across all `roomType` values, with realistic Indian localities and colleges
- **Rent:** ₹4,000–₹25,000 stored in **paise** (400000–2500000)
- **Images:** Unsplash/Picsum URLs with blurhash placeholders
- **Users:** 2 students, 1 verified owner, 1 unverified owner
- All bookings/tours/reviews in various statuses
- Use `faker.seed(42)` for deterministic output

## Error injection (dev menu)

The dev menu can force specific errors:
- `500` Internal Server Error
- `409 BOOKING_SLOT_TAKEN`
- `429 RATE_LIMITED`
- Offline mode

## Mock data persistence

Optionally persist to MMKV so data survives reloads. The dev menu has a "Reset mock data" button.

## Flipping a feature to HTTP

1. Update `src/api/mode.ts` to set the feature override to `'http'`.
2. Ensure `feature/api.ts` has the HTTP path implemented.
3. Run the feature's Maestro flows against the staging API.
4. Update `docs/mobile-plan.md` status: `mock` → `http-ready` → `live`.

