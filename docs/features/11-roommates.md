# 11 — Roommate Matching

**Phase 4** · Module: `roommates`

## 1. Goal & user stories

- As a **student**, I create a roommate profile (city, budget, move-in date, lifestyle) and see compatible students ranked by fit, with a reason for each match.
- As a **student**, I send a request. If it's accepted, we both see each other's contact details and can look for a place together.
- As a **student**, I hide my profile once I've found someone.

## 2. Scope

**In:**
- Profile upsert.
- Compatibility scoring.
- Ranked matches (top N).
- Requests (send, accept, decline, cancel).
- Contact reveal on accept.
- Hide or deactivate a profile.

**Out:**
- Group matching (3+ people).
- In-app chat between roommates. On accept, contact details are revealed instead. Chat is a later candidate that reuses 09.

## 3. Data

`roommateProfiles/{uid}`:

| Field | Type | Notes |
| --- | --- | --- |
| `citySlug` | string | Required |
| `preferredLocalities` | string[] ≤ 5 | |
| `budgetMinPaise`, `budgetMaxPaise` | int | min ≤ max |
| `moveInBy` | Timestamp | |
| `gender` | from the user profile | Copied for querying |
| `preferredGender` | `any \| same` | |
| `lifestyle` | `{ smoking: bool, drinking: bool, diet: veg\|non_veg\|eggetarian, pets: bool, sleepSchedule: early\|late\|flexible, cleanliness: 1-5, guests: rarely\|sometimes\|often, studyHabits: quiet\|music\|flexible }` | |
| `bio` | ≤ 300 | |
| `interests` | `Interest[]` ≤ 10 (closed enum) | |
| `college` | string? | |
| `isActive` | bool | Auto-false after 60 days without login, or on booking completion |
| `updatedAt` | | |

`roommateRequests/{fromUid}_{toUid}` (deterministic ID, so there's never a duplicate): `{ fromUid, toUid, message ≤ 300, status: RoommateRequestStatus = pending|accepted|declined|cancelled|expired, createdAt, respondedAt? }`

Indexes:
- `roommateProfiles`: `(isActive, citySlug, gender, moveInBy)` and `(isActive, citySlug, moveInBy)`.
- `roommateRequests`: `(toUid, status, createdAt desc)` and `(fromUid, status, createdAt desc)`.

## 4. Compatibility score (0–100)

Hard filters (the candidate is excluded if any fails):
- same `citySlug`;
- `isActive`;
- not self;
- not blocked;
- gender preference satisfied **both ways**;
- budget ranges overlap;
- `|moveInBy Δ| ≤ 45 days`.

Weighted score:

| Component | Weight | Function |
| --- | --- | --- |
| Budget overlap | 20 | overlap / smaller range width |
| Move-in proximity | 10 | linear decay over 45 days |
| Locality overlap | 15 | Jaccard of `preferredLocalities` (neutral 0.5 if either is empty) |
| Smoking / drinking / pets | 15 | 5 each; match = 1, mismatch = 0 |
| Diet | 5 | veg vs non_veg = 0, otherwise 1 |
| Sleep schedule | 10 | equal or either flexible = 1, otherwise 0 |
| Cleanliness | 10 | 1 − abs(Δ)/4 |
| Guests / study habits | 5 | average match |
| Interests | 5 | Jaccard |
| Same college | 5 | bonus |

Implement it as a **pure function** in `roommates/scoring.ts` with exhaustive unit tests. The response includes the top 3 `reasons` (for example "Both vegetarian", "Budgets overlap ₹6–8k").

## 5. Endpoints

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| PUT | `/v1/roommates/profile` | student | full profile DTO | `RoommateProfileDto` | `VALIDATION_FAILED`, `GENDER_REQUIRED` (if `preferredGender=same` and gender is undisclosed) |
| GET | `/v1/roommates/profile` | student | — | own profile | `NOT_FOUND` |
| POST | `/v1/roommates/profile/actions` | student | `{ action: activate \| deactivate }` | profile | — |
| GET | `/v1/roommates/matches?limit=` | student (active profile) | `limit` ≤ 50 | `{ items: [{ profile: PublicRoommateDto, score, reasons[] }], computedAt }` | `PROFILE_REQUIRED` |
| POST | `/v1/roommates/requests` | student | `{ toUid, message? }` | `201 RequestDto` | `DUPLICATE_REQUEST`, `TARGET_INACTIVE`, `TOO_MANY_REQUESTS` (10 per day), `BLOCKED` |
| GET | `/v1/roommates/requests?direction=incoming\|outgoing&status=&cursor=` | student | — | `Page<RequestDto>` | — |
| POST | `/v1/roommates/requests/:id/actions` | recipient (accept/decline) or sender (cancel) | `{ action }` | `RequestDto`. On accept it includes `contact` for both. | `INVALID_TRANSITION`, `FORBIDDEN` |

**Matches are not paginated.** The list is bounded to the top 50 and returned whole, which complies with the "no offset" rule. Computation: query hard-filtered candidates (≤ 500, ordered by `moveInBy`), score them in memory, sort, and slice. Cache the result in `roommateMatchCache/{uid}` for 1 h, invalidated on own profile update.

## 6. Business rules

- A reverse pending request (B→A exists while A→B is sent) **auto-accepts both**. It's a mutual match.
- Pending requests expire after 14 days.
- `PublicRoommateDto` has no contact details and no exact college unless shared. It shows the first name and last initial only, with the avatar.
- Becoming an owner (02) or completing a booking deactivates the profile. The user can re-activate it.

## 7. Side effects

- Notifications: `roommate_request` (to recipient) and `roommate_accepted` (to both).

## 8. Edge cases

- The candidate pool exceeds 500 in a big city: tighten the query with `moveInBy` within ±45 days (it's in the index), then cap it. Precomputing with a nightly function is the Phase 6 optimization if latency exceeds 500 ms.
- A user deactivates with pending requests: incoming requests are auto-declined and outgoing ones are cancelled.

## 9. Acceptance tests

- Scoring unit tests: identical profiles score about 100, and a hard-filter failure excludes the candidate. Every weight is exercised. Scores are deterministic.
- With seeded profiles, matches come back ordered as expected (fixture snapshot).
- Send → accept reveals contact. A duplicate send returns 409. A mutual send auto-accepts.
- An owner calling match endpoints gets 403.

## 10. Open questions

- Should students be able to filter roommates by college or exclude them? Leave this until there's real data.
