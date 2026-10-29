# 07 — Bookings

**Phase 3** · Module: `bookings`

## 1. Goal & user stories

- As a **student**, I apply for a room with my move-in date, duration, and a message. I track the status and can withdraw.
- As an **owner**, I see incoming applications, approve or reject them, and mark check-in and completion.
- As **both**, once a booking is approved we see each other's contact details and the exact address.
- As the **platform**, a bed or unit is never given to more than `capacity` students at once.

## 2. Scope

**In:**
- Applications.
- The approval queue.
- Inventory via `availableSlots` (transactional).
- The status machine with history.
- Expiry.
- Cancellation.
- Contact reveal.
- Notifications.

**Out (v1):**
- **Online payments.** Deposit and rent are paid offline. The booking records the agreed amounts only.
- Rent agreements and e-sign.
- Partial-month logic.

## 3. Data — `bookings/{id}`

| Field | Type | Notes |
| --- | --- | --- |
| `propertyId`, `studentId`, `ownerId` | string | Denormalized for both list views |
| `propertySnapshot` | `{ title, coverImage, locality, citySlug, roomType }` | For list rendering |
| `moveInDate` | Timestamp (date) | ≥ today, ≥ `availableFrom`, ≤ today + 120 days |
| `durationMonths` | int | ≥ `minStayMonths`, ≤ 24 |
| `occupants` | int | 1 for `per_bed`. For `whole_unit`, up to the owner-defined max (default 1). |
| `agreedRentPaise`, `agreedDepositPaise` | int | Copied from the property at application time. The owner may adjust them on approve. |
| `message` | ≤ 500 | |
| `status` | `BookingStatus` (below) | |
| `history[]` | `{ status, at, by, note? }` | |
| `expiresAt` | Timestamp | `pending` expires 72 h after creation |
| `cancellation` | `{ by: student\|owner\|admin, reason: CancellationReason, note? }?` | |
| `idempotencyKey` | string | |
| `createdAt`, `updatedAt`, `decidedAt?` | | |

`properties/{id}/occupancy/{bookingId}`: `{ studentId, from, to, status }`. This is written in the same transaction as approval, gives an audit view of who holds a slot, and lets `CAPACITY_BELOW_OCCUPIED` checks avoid a query.

Indexes: `(studentId, status, createdAt desc)`, `(ownerId, status, createdAt desc)`, `(propertyId, status, createdAt desc)`, and `(status, expiresAt)` for the expiry job.

## 4. State machine

```
pending ──approve(owner)──▶ approved ──check_in(owner)──▶ checked_in ──complete(owner|auto)──▶ completed
   │                          │
   ├──reject(owner)──▶ rejected
   ├──withdraw(student)──▶ withdrawn
   └──(72h, job)──▶ expired   approved ──cancel(student|owner|admin)──▶ cancelled
```

| Action | Who | From | Inventory effect |
| --- | --- | --- | --- |
| `approve` | owner | pending | **Transaction:** read the property. If `availableSlots < occupants`, throw `BOOKING_SLOT_TAKEN`. Otherwise decrement and create the occupancy doc. |
| `reject` | owner | pending | none. Requires a `reason`. |
| `withdraw` | student | pending | none |
| `cancel` | either / admin | approved | **Transaction:** increment `availableSlots` and delete the occupancy doc. Requires a `reason`. |
| `check_in` | owner | approved | none. Allowed from `moveInDate - 3 days`. |
| `complete` | owner, or auto at `moveInDate + durationMonths` | checked_in | **Transaction:** increment `availableSlots` and close the occupancy doc. Unlocks a review (12). |

**Why capacity is consumed at approval, not at application:** students apply to several rooms. Holding inventory on application would let a few students block every listing. The owner sees how many slots are left when approving.

## 5. Endpoints

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/bookings` | student (phone verified) | `{ propertyId, moveInDate, durationMonths, occupants?, message? }` + `Idempotency-Key` header | `201 BookingDto` | `PHONE_REQUIRED` (403), `PROPERTY_UNAVAILABLE` (409: not published or 0 slots), `DUPLICATE_APPLICATION` (409), `TOO_MANY_PENDING` (409, max 5), `GENDER_POLICY_MISMATCH` (409), `VALIDATION_FAILED` |
| GET | `/v1/bookings?status=&cursor=` | student | — | `Page<BookingDto>` (own) | — |
| GET | `/v1/owners/bookings?status=&propertyId=&cursor=` | owner | — | `Page<BookingDto>` with `student: PublicUserDto` + `studentSignals` (verified phone/email, member since, completed bookings count) | — |
| GET | `/v1/bookings/:id` | student/owner (party) or admin | — | `BookingDto`. Includes `contact` (other party's phone and email) and `property.address` + exact geo only when status ∈ {approved, checked_in, completed}. | `NOT_FOUND` |
| POST | `/v1/bookings/:id/actions` | per action table | `{ action, reason?, note?, agreedRentPaise?, agreedDepositPaise? }` | `BookingDto` | `INVALID_TRANSITION`, `BOOKING_SLOT_TAKEN`, `FORBIDDEN`, `CHECK_IN_TOO_EARLY` |

This replaces `PATCH /v1/bookings/:id/status` from the original plan, following the `api-design` skill's action convention.

## 6. Business rules

- **Application creation** runs in a transaction that:
  - reads the property (it must be published with `availableSlots > 0`);
  - checks for a duplicate with a deterministic lock doc `bookingLocks/{studentId}_{propertyId}`, which exists while a pending or approved booking exists;
  - enforces the pending cap through a per-student counter doc `bookingStats/{studentId}.pending`.
- A student can't book their own listing (an owner can't be a student anyway, but check defensively).
- **Gender policy:** if the property is `male_only` or `female_only` and the student's `gender` is set and incompatible, the application is rejected. If gender is `undisclosed`, the application is allowed and the owner decides.
- **Auto-reject on fill:** when approval leaves `availableSlots == 0`, the other `pending` applications for that property are **not** auto-rejected. They stay pending and get a "listing is now full" notice. The owner can still approve if a slot frees up, and they otherwise expire.
- **Pending expiry:** a scheduled job runs every 15 min and expires `pending` bookings past `expiresAt`. The owner's response-rate metric counts expiries as non-responses.
- **Auto-complete:** a daily job completes `checked_in` bookings past their end date.
- **Cancellation of approved bookings within 48 h of move-in** is allowed but flagged (`lateCancellation: true`) for owner and student reliability signals.

## 7. Side effects (trigger `onBookingWrite` → notifications, 10)

| Transition | Notify | Channels |
| --- | --- | --- |
| created | owner | push, email, sms |
| approved | student | push, email, sms |
| rejected / expired | student | push, email |
| withdrawn | owner | push |
| cancelled | the other party | push, email, sms |
| check_in reminder (move-in − 1 day) | both | push |
| completed | student (review prompt) | push, email |

Counters: `properties_{id}_bookings` is incremented on approve. Owner response metrics are updated on decide.

## 8. Security

- Only the parties and admins can read a booking. Students can only create.
- Optional Firestore read rule so the mobile app gets live booking status: `bookings/{id}` readable if `request.auth.uid in [resource.data.studentId, resource.data.ownerId]`. **Recommended.** It needs a rules test. The contact fields are not stored on the booking, so the doc is safe to expose.

## 9. Edge cases

- **Two owners' devices approve two different applications for the last slot at once:** one transaction wins and the other gets `BOOKING_SLOT_TAKEN`. This is the Phase 3 acceptance gate.
- The same student double-taps apply: the idempotency key returns the same booking, and without a key the lock doc returns `DUPLICATE_APPLICATION`.
- The property is deleted or suspended while bookings are pending: they auto-reject with reason `listing_unavailable`. Approved bookings stay, and an admin handles them.
- The student account is deleted with a completed booking: the booking is kept and anonymized (02).
- The owner edits rent after an application: the agreed price is the snapshot value, and the owner can change it on approve. The student sees the change in a notification.

## 10. Acceptance tests

- Happy path: apply → approve → contact revealed → check-in → complete → review unlocked.
- **Concurrency:** 10 parallel approves on a 1-slot property give exactly one 200 and nine 409s, and `availableSlots` ends at 0 (emulator).
- A duplicate application returns 409. Pending number 6 returns 409. A guest returns 401. A student without a phone returns 403.
- Cancel after approve restores `availableSlots`.
- The expiry job moves a 73 h-old pending booking to `expired` (unit, with mocked time).
- An owner of a different property calling approve gets 403. A student calling approve gets 403.

## 11. Open questions

- **Payments:** should v1 collect a booking token amount online (Razorpay)? This spec assumes no. Adding it later changes the state machine (`approved → awaiting_payment → confirmed`).
- Is a 72 h pending expiry right? 48 h pushes owners to respond faster.
